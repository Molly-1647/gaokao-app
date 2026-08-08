#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
高考志愿填报APP - Flask后端主入口
使用应用工厂模式: create_app(config_name)
"""

import os
import json
import sys
import time
from datetime import datetime

# 将当前目录加入 path，便于 import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify, g, send_from_directory
from flask_cors import CORS

from config import config
from extensions import db
from models import (
    Province, School, Major, UserProfile, HollandResult,
    RecommendPlan, UserMajorPreference, KnowledgeBase
)

# ============================================================
# RAG 引擎初始化（轻量版：纯TF-IDF，无需chromadb/sentence-transformers）
# ============================================================
RAG_AVAILABLE = False
rag_engine = None

try:
    from simple_rag import init_rag as _init_rag
    RAG_AVAILABLE = True
except Exception as e:
    print(f"[RAG] simple_rag 模块导入失败: {e}")


def init_rag(persist_dir=None):
    """初始化RAG引擎"""
    global rag_engine
    if not RAG_AVAILABLE:
        return False
    try:
        data_dir = os.path.dirname(os.path.abspath(__file__))
        rag_engine = _init_rag(data_dir=data_dir)
        if rag_engine._loaded:
            print(f"[RAG] 轻量引擎初始化成功，文档块: {len(rag_engine.chunks)}")
            return True
        else:
            print("[RAG] 文档数据未加载，RAG功能不可用")
            return False
    except Exception as e:
        print(f"[RAG] 引擎初始化失败: {e}")
        import traceback
        traceback.print_exc()
        return False


# ============================================================
# 应用工厂函数（Gunicorn 调用入口: app:create_app('production')）
# ============================================================
def create_app(config_name='default'):
    """Flask 应用工厂"""
    app = Flask(__name__)

    # 加载配置
    app.config.from_object(config.get(config_name, config['default']))

    # 从环境变量覆盖 DATABASE_URL（支持 .env 配置）
    env_db = os.environ.get('DATABASE_URL')
    if env_db:
        app.config['SQLALCHEMY_DATABASE_URI'] = env_db

    # CORS 跨域
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "expose_headers": ["Content-Range", "X-Total-Count"],
            "max_age": 3600,
        }
    }, supports_credentials=True)

    # 初始化扩展
    db.init_app(app)

    # 初始化数据库表（无需单独执行 flask db upgrade）
    with app.app_context():
        db.create_all()
        print(f"[DB] 数据库表已就绪: {app.config.get('SQLALCHEMY_DATABASE_URI')}")

    # 初始化 RAG 引擎
    if RAG_AVAILABLE:
        with app.app_context():
            rag_dir = os.environ.get(
                'CHROMA_PERSIST_DIR',
                os.path.join(os.path.dirname(os.path.abspath(__file__)), 'chroma_db')
            )
            if not init_rag(persist_dir=rag_dir):
                print("[RAG] 初始化失败（不影响其他API）")

    # 注册蓝图 / 路由
    register_routes(app)

    # ============================================================
    # 前端静态文件托管（全栈单服务模式）
    # 当 static 目录存在时，Flask 直接托管前端构建产物
    # ============================================================
    static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
    if os.path.isdir(static_dir):
        @app.route('/', methods=['GET'])
        def index():
            return send_from_directory(static_dir, 'index.html')

        @app.route('/<path:path>', methods=['GET'])
        def static_files(path):
            # API 路由不走这里（已注册的蓝图优先匹配）
            full = os.path.join(static_dir, path)
            if os.path.isfile(full):
                return send_from_directory(static_dir, path)
            # SPA History 模式回退
            return send_from_directory(static_dir, 'index.html')

        print(f"[STATIC] 前端静态文件目录: {static_dir}")

    # 请求耗时日志中间件
    @app.before_request
    def start_timer():
        g.start_time = time.time()

    @app.after_request
    def log_request(response):
        if hasattr(g, 'start_time'):
            cost_ms = int((time.time() - g.start_time) * 1000)
            if cost_ms > 500:
                print(f"[SLOW] {request.method} {request.path} -> {response.status_code} {cost_ms}ms")
        return response

    return app


# ============================================================
# 路由注册
# ============================================================
def register_routes(app):
    """注册所有 API 路由"""

    # ---------------- 健康检查 ----------------
    @app.route('/api/health', methods=['GET'])
    def api_health():
        """容器健康检查 & 服务自检"""
        info = {
            "ok": True,
            "service": "gaokao-volunteer-backend",
            "time": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "db": "disconnected",
            "rag": "disabled",
        }
        try:
            db.session.execute('SELECT 1') if False else Province.query.first()
            info['db'] = "ok"
        except Exception as e:
            info['db'] = f"error: {e}"

        if RAG_AVAILABLE and rag_engine:
            info['rag'] = "ok"
            info['rag_mode'] = "tfidf"

        return jsonify(info), 200

    # ---------------- 基础数据: 省份 ----------------
    @app.route('/api/provinces', methods=['GET'])
    def api_provinces():
        """获取所有省份列表"""
        provinces = Province.query.order_by(Province.id).all()
        # 如果数据库还未初始化，返回默认省份
        if not provinces:
            data = [
                {"id": i + 1, "name": p, "coverage": ["本科批", "专科批", "强基计划"]}
                for i, p in enumerate([
                    "北京", "天津", "河北", "山西", "内蒙古", "辽宁", "吉林", "黑龙江",
                    "上海", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南",
                    "湖北", "湖南", "广东", "广西", "海南", "重庆", "四川", "贵州",
                    "云南", "西藏", "陕西", "甘肃", "青海", "宁夏", "新疆"
                ])
            ]
            return jsonify(data)
        return jsonify([p.to_dict() for p in provinces])

    # ---------------- 基础数据: 院校列表 ----------------
    @app.route('/api/schools', methods=['GET'])
    def api_schools():
        """获取指定省份的院校列表"""
        province_name = request.args.get('province', '').strip()
        if not province_name:
            return jsonify({"error": "缺少 province 参数"}), 400

        province = Province.query.filter_by(name=province_name).first()
        if not province:
            # 没数据时，尝试用 JSON 兜底
            return jsonify(_fallback_schools_from_json(province_name))

        schools = School.query.filter_by(province_id=province.id).order_by(School.rank.asc()).all()
        return jsonify([s.to_dict() for s in schools])

    # ---------------- 基础数据: 专业列表 ----------------
    @app.route('/api/majors', methods=['GET'])
    def api_majors():
        """获取专业列表（可选查询）"""
        category = request.args.get('category', '').strip()
        keyword = request.args.get('keyword', '').strip()
        q = Major.query
        if category:
            q = q.filter(Major.category == category)
        if keyword:
            q = q.filter(Major.name.like(f'%{keyword}%'))
        majors = q.limit(100).all()
        if not majors:
            return jsonify(_fallback_majors())
        return jsonify([m.to_dict() for m in majors])

    # ---------------- 志愿推荐引擎 ----------------
    @app.route('/api/recommend', methods=['POST'])
    def api_recommend():
        """按位次和权重，推荐冲/稳/保三类院校"""
        data = request.get_json(silent=True) or {}
        province = str(data.get('province', '')).strip()
        user_rank = data.get('rank') or data.get('userRank')
        weights = data.get('weights') or {'major': 34, 'school': 33, 'city': 33}
        score = data.get('score')

        try:
            user_rank = int(user_rank)
        except (TypeError, ValueError):
            return jsonify({"error": "位次(rank)必须是正整数"}), 400

        if not province or user_rank <= 0:
            return jsonify({"error": "缺少 province 或 rank 参数"}), 400

        # 1. 从数据库取院校（无则从 JSON 兜底）
        school_list = _get_school_list(province)

        # 2. 分类冲/稳/保
        buckets = {"sprint": [], "stable": [], "safe": []}
        TIER_LABEL = {
            '985': '985', '211': '211', '双一流': '双一流',
            '双非': '双非强校', '行业特色': '行业特色'
        }

        def calc_match(key, r):
            if key == 'sprint':
                m = 70 + 15 * min(1, r / 0.9)
            elif key == 'stable':
                m = 96 - 8 * abs(r - 1) / 0.1
            else:
                m = 98 - 8 * min(1, (r - 1.1) / 0.5)
            return max(50, min(99, round(m)))

        def sort_key(item):
            import math
            r = max(1e-6, ((item.get('rank') or user_rank) / user_rank))
            closeness = abs(math.log(r))
            bias = 0
            w = weights or {'major': 34, 'school': 33, 'city': 33}
            tier = item.get('tier', '')
            if w.get('school', 33) >= w.get('city', 33) and tier in ('985', '211'):
                bias -= 0.03
            if w.get('city', 33) > w.get('school', 33) and tier in ('行业特色', '双非', '双一流'):
                bias -= 0.03
            return closeness + bias

        for s in school_list:
            r_school = s.get('rank') or 0
            if not r_school or r_school <= 0:
                continue
            r = r_school / user_rank
            if r < 0.9:
                key = 'sprint'
            elif r <= 1.1:
                key = 'stable'
            else:
                key = 'safe'

            match = calc_match(key, r)
            tier_raw = s.get('tier', '')
            tags = [TIER_LABEL.get(tier_raw, tier_raw)] if tier_raw else []
            if s.get('industry'):
                tags.append(s['industry'])

            score_val = s.get('score')
            rank_str = f"{r_school:,}"
            buckets[key].append({
                'school': s.get('school') or s.get('school_name', ''),
                'score': score_val,
                'rank': r_school,
                'tier': tags,
                'tierKey': key,
                'industry': s.get('industry', ''),
                'note': s.get('note', ''),
                'province': province,
                'match': match,
                'hit': '冲刺' if key == 'sprint' else '稳妥' if key == 'stable' else '保底',
                'group': f"最低 {score_val or '—'} 分 · 位次约 {rank_str}",
            })

        # 3. 排序 + 去重 + 取 TopN
        limits = {"sprint": 3, "stable": 4, "safe": 3}
        for k in buckets:
            buckets[k].sort(key=sort_key)
            seen = set()
            filtered = []
            for it in buckets[k]:
                name = it.get('school', '')
                if name in seen:
                    continue
                seen.add(name)
                filtered.append(it)
            buckets[k] = filtered[:limits[k]]

        return jsonify({
            **buckets,
            "base": {
                "province": province,
                "rank": user_rank,
                "score": score,
                "weights": weights
            }
        })

    # ---------------- 生成完整志愿方案 ----------------
    @app.route('/api/generate_plan', methods=['POST'])
    def api_generate_plan():
        """生成完整志愿方案（可作为持久化快照）"""
        data = request.get_json(silent=True) or {}
        # 1. 手动构造推荐（不直接解包api_recommend的Response）
        with app.test_request_context('/api/recommend', method='POST', json=data):
            rec_resp = api_recommend()
            if isinstance(rec_resp, tuple):
                plan_resp, status_code = rec_resp
                if status_code != 200:
                    return plan_resp, status_code
            else:
                plan_resp = rec_resp
            plan_result = plan_resp.get_json() if hasattr(plan_resp, 'get_json') else plan_resp

        # 2. 附加 RAG 专业/政策解读（如果可用）
        rag_contexts = []
        province = str(data.get('province', ''))
        major_hint = data.get('preferredMajors') or data.get('first_choice') or ''
        if RAG_AVAILABLE and rag_engine:
            query_str = f"{province} {major_hint} 志愿填报政策 专业解读"
            try:
                rag_hits = rag_engine.search(query_str, n_results=3)
                rag_contexts = [h.get('content', '') for h in rag_hits if h.get('content')]
            except Exception as e:
                print(f"[RAG] 方案生成时检索失败: {e}")

        plan_result['plan_notes'] = rag_contexts[:2] if rag_contexts else [
            "建议结合本省 2026 年招生目录，核对院校专业组选科要求和近三年投档位次走势。",
            "志愿梯度建议按“冲 25% · 稳 45% · 保 30%”比例分布，务必服从调剂降低退档风险。"
        ]
        plan_result['generated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # 3. 保存到数据库（可选，便于用户回访）
        try:
            profile = _ensure_user_profile(data)
            plan = RecommendPlan(
                user_profile_id=profile.id if profile else None,
                plan_data=json.dumps(plan_result, ensure_ascii=False)
            )
            db.session.add(plan)
            db.session.commit()
            plan_result['plan_id'] = plan.id
        except Exception as e:
            print(f"[DB] 保存方案失败: {e}")
            db.session.rollback()

        return jsonify(plan_result)

    # ---------------- 霍兰德测试: 题库 ----------------
    @app.route('/api/holland/quiz', methods=['GET'])
    def api_holland_quiz():
        """返回霍兰德职业兴趣测试题（RIASEC 六型，共 36 题）"""
        questions = _holland_questions()
        return jsonify(questions)

    # ---------------- 霍兰德测试: 结果分析 ----------------
    @app.route('/api/holland/analyze', methods=['POST'])
    def api_holland_analyze():
        """计算霍兰德得分并返回推荐专业"""
        data = request.get_json(silent=True) or {}
        answers = data.get('answers', [])  # [{index, type, answer: 0/1}]
        if not isinstance(answers, list) or not answers:
            return jsonify({"error": "answers 参数缺失"}), 400

        # 计算6维度得分
        scores = {'R': 0, 'I': 0, 'A': 0, 'S': 0, 'E': 0, 'C': 0}
        for a in answers:
            t = str(a.get('type', '')).upper()
            if t in scores and a.get('answer'):
                scores[t] += 1

        # 取前三为代码
        sorted_items = sorted(scores.items(), key=lambda x: (-x[1], x[0]))
        code = ''.join([x[0] for x in sorted_items[:3]])

        # 推荐专业映射
        suggestions = _holland_suggestion(code, scores)

        # 存库（可选）
        try:
            profile = _ensure_user_profile(data.get('profile') or {})
            holland = HollandResult(
                user_profile_id=profile.id if profile else None,
                code=code,
                scores_r=scores['R'], scores_i=scores['I'], scores_a=scores['A'],
                scores_s=scores['S'], scores_e=scores['E'], scores_c=scores['C'],
                suggestions=json.dumps(suggestions, ensure_ascii=False)
            )
            db.session.add(holland)
            db.session.commit()
        except Exception as e:
            print(f"[DB] 保存霍兰德结果失败: {e}")
            db.session.rollback()

        return jsonify({
            "code": code,
            "allScores": scores,
            "sorted": sorted_items,
            "suggestions": suggestions
        })

    # ---------------- RAG: 知识检索 ----------------
    @app.route('/api/rag/search', methods=['POST'])
    def api_rag_search():
        """RAG知识库检索（用于 AI问答 / 政策解读）"""
        data = request.get_json(silent=True) or {}
        query = str(data.get('query', '')).strip()
        top_k = min(int(data.get('top_k', 5) or 5), 10)
        if not query:
            return jsonify({"error": "query 参数不能为空"}), 400

        results = []
        mode = "disabled"

        # 1. 优先向量库RAG
        if RAG_AVAILABLE and rag_engine:
            try:
                hits = rag_engine.search(query, n_results=top_k)
                if hits:
                    mode = "tfidf"
                    results = [{
                        "id": h.get('id', i),
                        "content": h.get('content', ''),
                        "source": h.get('source', h.get('metadata', {}).get('source', '')),
                        "score": h.get('score'),
                        "distance": h.get('distance'),
                    } for i, h in enumerate(hits)]
            except Exception as e:
                print(f"[RAG] 检索异常: {e}")

        # 2. 兜底：SQL 知识库匹配
        if not results:
            try:
                like = f"%{query}%"
                rows = KnowledgeBase.query.filter(
                    (KnowledgeBase.content.like(like)) |
                    (KnowledgeBase.keywords.like(like))
                ).limit(top_k).all()
                if rows:
                    mode = mode + "+sql" if mode != "disabled" else "sql"
                    results = [{
                        "id": r.id,
                        "content": r.content,
                        "source": r.source,
                        "keywords": r.keywords.split(',') if r.keywords else [],
                        "score": 1.0,
                    } for r in rows]
            except Exception as e:
                print(f"[RAG] SQL兜底检索失败: {e}")

        # 3. 再兜底：模板话术（避免前端空数据）
        if not results:
            mode = "fallback"
            results = [{
                "id": 0,
                "content": (
                    f"关于「{query}」，建议：1) 以本省教育考试院公布的《2026年招生计划》和"
                    "《投档分及位次对照表》为准；2) 查看院校官网招生章程中的选科要求、身体条件、"
                    "单科成绩限制；3) 使用APP的「方案生成」功能比对近3年位次走势，确认冲稳保梯度。"
                ),
                "source": "系统兜底",
                "score": 0.0,
            }]

        return jsonify({
            "ok": True,
            "mode": mode,
            "query": query,
            "results": results,
        })

    # ---------------- 用户: 保存档案 ----------------
    @app.route('/api/user/save', methods=['POST'])
    def api_user_save():
        """保存用户输入的档案（分数/位次/选科/权重等）"""
        data = request.get_json(silent=True) or {}
        profile = _ensure_user_profile(data, create=True)
        if not profile:
            return jsonify({"error": "数据不足"}), 400
        return jsonify({"ok": True, "profile": profile.to_dict()})

    # ---------------- 用户: 加载档案 ----------------
    @app.route('/api/user/load', methods=['GET'])
    def api_user_load():
        """读取最新的用户档案及推荐方案（简化：取最近一条）"""
        profile = UserProfile.query.order_by(UserProfile.updated_at.desc()).first()
        result = {
            "ok": True,
            "profile": profile.to_dict() if profile else None,
            "last_plan": None,
            "last_holland": None,
        }
        if profile:
            last_plan = RecommendPlan.query.filter_by(
                user_profile_id=profile.id
            ).order_by(RecommendPlan.created_at.desc()).first()
            result['last_plan'] = last_plan.to_dict() if last_plan else None

            last_hol = HollandResult.query.filter_by(
                user_profile_id=profile.id
            ).order_by(HollandResult.created_at.desc()).first()
            result['last_holland'] = last_hol.to_dict() if last_hol else None

        return jsonify(result)


# ============================================================
# 辅助函数
# ============================================================
def _ensure_user_profile(data, create=True):
    """确保有一条用户档案记录，返回 Profile 对象"""
    if not data:
        return None

    pname = str(data.get('province') or data.get('province_name') or '').strip()
    rank = data.get('rank') or data.get('userRank')
    score = data.get('score')
    mode = str(data.get('mode') or data.get('examMode') or '物理类').strip()
    first = str(data.get('first_choice') or data.get('first') or '').strip()
    track = str(data.get('track') or '').strip()
    category = str(data.get('category') or '普通类').strip()
    weights = data.get('weights') or {}

    province = Province.query.filter_by(name=pname).first() if pname else None
    if (not province) and pname:
        province = Province(name=pname)
        db.session.add(province)
        db.session.commit()

    # 尝试找最新一条
    profile = UserProfile.query.order_by(UserProfile.updated_at.desc()).first()

    if not profile and create:
        profile = UserProfile()
        db.session.add(profile)
        db.session.commit()  # 确保获取 profile.id

    if profile:
        profile.province_id = province.id if province else profile.province_id
        profile.score = float(score) if score not in (None, '') else profile.score
        try:
            profile.rank = int(rank) if rank not in (None, '') else profile.rank
        except (TypeError, ValueError):
            pass
        profile.mode = mode or profile.mode
        profile.first_choice = first or profile.first_choice
        profile.track = track or profile.track
        profile.category = category or profile.category
        if isinstance(weights, dict):
            profile.weights_major = int(weights.get('major', profile.weights_major or 34))
            profile.weights_school = int(weights.get('school', profile.weights_school or 33))
            profile.weights_city = int(weights.get('city', profile.weights_city or 33))
        profile.updated_at = datetime.now()
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"[DB] 更新用户档案失败: {e}")

    return profile


def _get_school_list(province_name):
    """从数据库或JSON获取某省的院校列表"""
    # 1. 数据库
    province = Province.query.filter_by(name=province_name).first()
    if province:
        rows = School.query.filter_by(province_id=province.id).all()
        if rows:
            return [s.to_dict() for s in rows]
    # 2. JSON 兜底
    return _fallback_schools_from_json(province_name)


def _fallback_schools_from_json(province_name):
    """兜底：从前端的 JSON 静态数据里拿（初始化前可用）"""
    try:
        # 优先读取打包后的 static 目录（生产环境/Docker），其次读开发路径
        base_dir = os.path.dirname(os.path.abspath(__file__))
        candidates = [
            os.path.join(base_dir, 'static', 'gaokao-db.js'),
            os.path.join(base_dir, '..', 'frontend', 'dist', 'gaokao-db.js'),
            os.path.join(base_dir, '..', 'frontend', 'public', 'gaokao-db.js'),
        ]
        js_path = None
        for p in candidates:
            if os.path.exists(p):
                js_path = p
                break
        if not js_path:
            return []
        with open(js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        start = content.find('{')
        end = content.rfind('}') + 1
        if start < 0 or end <= 0:
            return []
        obj = json.loads(content[start:end])
        return obj.get('schools', {}).get(province_name, [])
    except Exception as e:
        print(f"[JSON] 兜底院校数据加载失败: {e}")
        return []


def _fallback_majors():
    return [
        {"id": 1, "name": "电子信息类", "category": "工学",
         "description": "通信、集成电路、嵌入式方向",
         "employment": "互联网大厂、通信运营商、科研院所"},
        {"id": 2, "name": "计算机类", "category": "工学",
         "description": "软件工程、人工智能、数据科学",
         "employment": "互联网、金融IT、各行业数字化部门"},
        {"id": 3, "name": "电气工程", "category": "工学",
         "description": "强电、电力系统、新能源",
         "employment": "国家电网、电力设计院、新能源企业"},
        {"id": 4, "name": "机械类", "category": "工学",
         "description": "设计、制造、自动化、材料成型",
         "employment": "汽车、高端装备、航空航天"},
        {"id": 5, "name": "金融学", "category": "经济学",
         "description": "投资、银行、证券、保险、量化",
         "employment": "银行、券商、基金、保险"},
        {"id": 6, "name": "临床医学", "category": "医学",
         "description": "临床诊断与治疗（学制5+3）",
         "employment": "各级医院、卫健委、药企"},
    ]


# ============================================================
# 霍兰德题库
# ============================================================
HOLLAND_TYPES = ['R', 'I', 'A', 'S', 'E', 'C']  # 实用/研究/艺术/社会/企业/常规

HOLLAND_BANK = {
    'R': [
        "我喜欢动手修理电器或机械",
        "我擅长使用工具、仪器或机械设备",
        "我喜欢户外活动、种植或饲养动植物",
        "我喜欢驾驶车辆或操作重型机械",
        "我对电子产品的构造和原理感兴趣",
        "我愿意参与建筑、装修、手工制作等活动",
    ],
    'I': [
        "我喜欢阅读科普类书籍和文章",
        "我善于通过实验、观察来验证想法",
        "我喜欢做数据分析或数学推理",
        "我对自然科学（物理/化学/生物）感兴趣",
        "我习惯用逻辑思维分析问题",
        "我喜欢查阅学术资料解决疑难问题",
    ],
    'A': [
        "我喜欢绘画、设计、摄影或手工艺术",
        "我对音乐、舞蹈、戏剧等表演有兴趣",
        "我喜欢写作、创作小说或诗歌",
        "我有独特的创意和审美追求",
        "我不喜欢按部就班的刻板工作",
        "我对时装、建筑、室内设计等感兴趣",
    ],
    'S': [
        "我喜欢帮助别人解决学习或生活难题",
        "我乐于参加志愿服务、公益活动",
        "我善于倾听别人并给出建议",
        "我对教育、心理咨询感兴趣",
        "我喜欢与团队协作、照顾他人",
        "我愿意从事医疗、护理、社会服务",
    ],
    'E': [
        "我喜欢担任班干部或组织活动",
        "我擅长说服别人、演讲或谈判",
        "我对创业、市场营销感兴趣",
        "我喜欢竞争、愿意承担风险和责任",
        "我擅长管理团队或主持项目",
        "我对金融投资、商业运作感兴趣",
    ],
    'C': [
        "我做事有条理、注重细节",
        "我喜欢整理档案、归档或管理资料",
        "我擅长计算、记账或数据统计",
        "我习惯按规则和制度办事",
        "我喜欢稳定、可预期的工作环境",
        "我对办公软件、表格处理很熟练",
    ],
}


def _holland_questions():
    qs = []
    idx = 0
    for t in HOLLAND_TYPES:
        for text in HOLLAND_BANK.get(t, []):
            qs.append({"index": idx, "type": t, "text": text})
            idx += 1
    return qs


def _holland_suggestion(code, scores):
    """根据霍兰德代码推荐专业"""
    code_to_majors = {
        'R': ['机械类', '自动化', '电气工程', '建筑学', '电子信息类'],
        'I': ['计算机类', '数学/统计学', '物理学', '生物科学', '心理学'],
        'A': ['设计学类', '新闻传播学', '音乐与美术', '建筑学'],
        'S': ['教育学', '护理学', '临床医学', '心理学'],
        'E': ['金融学', '工商管理', '市场营销', '法学'],
        'C': ['会计学', '财务管理', '信息管理', '工商管理'],
    }
    majors_set = []
    seen = set()
    for c in code:
        for m in code_to_majors.get(c, []):
            if m not in seen:
                seen.add(m)
                majors_set.append(m)
    # 取 Top 10
    majors_list = []
    for name in majors_set[:10]:
        major = Major.query.filter_by(name=name).first()
        if major:
            majors_list.append(major.to_dict())
        else:
            majors_list.append({
                "id": 0, "name": name, "category": "",
                "description": "", "employment": "相关行业就业前景良好"
            })
    return {
        "code": code,
        "scores": scores,
        "majors": majors_list,
        "description": _holland_code_desc(code),
    }


def _holland_code_desc(code):
    desc_map = {
        'R': '实用型(R) - 动手操作、技术技能',
        'I': '研究型(I) - 观察分析、求知探索',
        'A': '艺术型(A) - 创意想象、审美表达',
        'S': '社会型(S) - 沟通助人、教育关怀',
        'E': '企业型(E) - 组织领导、商业冒险',
        'C': '常规型(C) - 细致有序、稳健执行',
    }
    parts = []
    for c in code:
        if c in desc_map:
            parts.append(desc_map[c])
    return '；'.join(parts) + '。建议结合选科和身体条件进一步筛选。'


# ============================================================
# 命令行入口：python app.py 直接启动开发服务器
# ============================================================
if __name__ == '__main__':
    flask_app = create_app('development')
    host = os.environ.get('FLASK_HOST', '0.0.0.0')
    port = int(os.environ.get('FLASK_PORT', '5000'))
    print(f"🚀 高考志愿填报APP后端启动: http://{host}:{port}")
    flask_app.run(host=host, port=port, debug=False)
