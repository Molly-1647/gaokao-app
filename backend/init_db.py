#!/usr/bin/env python3
"""
数据库初始化脚本
将JSON文件中的高考数据导入到SQLite数据库中
"""

import json
import os
import sys

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from extensions import db
from models import Province, School, Major, KnowledgeBase

def load_json_data():
    """加载JSON数据库文件"""
    json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../frontend/public/gaokao-db.js')
    with open(json_path, 'r', encoding='utf-8') as f:
        content = f.read()
        data_start = content.find('{')
        data_end = content.rfind('}') + 1
        return json.loads(content[data_start:data_end])

def init_provinces(app, gk_db):
    """初始化省份数据"""
    with app.app_context():
        # 获取已有省份名
        existing_provinces = {p.name for p in Province.query.all()}
        
        provinces = gk_db.get('provinces', [])
        coverage = gk_db.get('coverage', {})
        
        added = 0
        for province_name in provinces:
            if province_name not in existing_provinces:
                province = Province(
                    name=province_name,
                    coverage=','.join(coverage.get(province_name, []))
                )
                db.session.add(province)
                added += 1
        
        if added > 0:
            db.session.commit()
        print(f"省份数据: 新增 {added} 条")

def init_schools(app, gk_db):
    """初始化院校数据"""
    with app.app_context():
        schools_data = gk_db.get('schools', {})
        
        added = 0
        for province_name, schools in schools_data.items():
            province = Province.query.filter_by(name=province_name).first()
            if not province:
                province = Province(name=province_name)
                db.session.add(province)
                db.session.commit()
            
            # 获取已有院校名
            existing_schools = {s.school_name for s in School.query.filter_by(province_id=province.id).all()}
            
            for school in schools:
                if school.get('school') and school['school'] not in existing_schools:
                    s = School(
                        province_id=province.id,
                        school_name=school['school'],
                        tier=school.get('tier', ''),
                        industry=school.get('industry', ''),
                        score=school.get('score'),
                        rank=school.get('rank'),
                        note=school.get('note', '')
                    )
                    db.session.add(s)
                    added += 1
        
        if added > 0:
            db.session.commit()
        print(f"院校数据: 新增 {added} 条")

def init_majors(app):
    """初始化专业数据"""
    with app.app_context():
        # 获取已有专业名
        existing_majors = {m.name for m in Major.query.all()}
        
        majors_list = [
            {'name': '电子信息类', 'category': '工学', 'description': '培养掌握电子技术、通信技术、计算机技术等方面的知识和技能。'},
            {'name': '机械类', 'category': '工学', 'description': '培养具备机械设计、制造、自动化等方面的知识和能力。'},
            {'name': '自动化', 'category': '工学', 'description': '培养从事工业自动化控制、智能系统设计等工作的高级工程技术人才。'},
            {'name': '电气工程', 'category': '工学', 'description': '培养从事电气工程及其自动化领域的工程技术人才。'},
            {'name': '计算机类', 'category': '工学', 'description': '培养掌握计算机科学与技术、软件工程等方面的知识和技能。'},
            {'name': '数学/统计学', 'category': '理学', 'description': '培养具备数学理论基础和应用能力的高级专门人才。'},
            {'name': '物理学', 'category': '理学', 'description': '培养掌握物理学基本理论和实验技能的高级专门人才。'},
            {'name': '生物科学', 'category': '理学', 'description': '培养具备生物科学基本理论和实验技能的高级专门人才。'},
            {'name': '设计学类', 'category': '艺术学', 'description': '培养具备设计理论和实践能力的高级艺术设计人才。'},
            {'name': '建筑学', 'category': '工学', 'description': '培养具备建筑设计、城市规划等方面知识和能力的高级工程技术人才。'},
            {'name': '新闻传播学', 'category': '文学', 'description': '培养具备新闻传播理论和实践能力的高级专门人才。'},
            {'name': '音乐与美术', 'category': '艺术学', 'description': '培养具备音乐或美术专业知识和技能的高级艺术人才。'},
            {'name': '临床医学', 'category': '医学', 'description': '培养从事临床医疗工作的高级医学人才。'},
            {'name': '教育学', 'category': '教育学', 'description': '培养具备教育理论和实践能力的高级教育人才。'},
            {'name': '心理学', 'category': '理学', 'description': '培养具备心理学基本理论和应用能力的高级专门人才。'},
            {'name': '护理学', 'category': '医学', 'description': '培养具备护理理论和实践能力的高级护理人才。'},
            {'name': '工商管理', 'category': '管理学', 'description': '培养具备管理、经济、法律等方面知识的高级管理人才。'},
            {'name': '金融学', 'category': '经济学', 'description': '培养具备金融理论和实践能力的高级金融人才。'},
            {'name': '经济学', 'category': '经济学', 'description': '培养具备经济学理论和应用能力的高级专门人才。'},
            {'name': '市场营销', 'category': '管理学', 'description': '培养具备市场营销理论和实践能力的高级管理人才。'},
            {'name': '会计学', 'category': '管理学', 'description': '培养具备会计理论和实践能力的高级会计人才。'},
            {'name': '法学', 'category': '法学', 'description': '培养具备法律理论和实践能力的高级法律人才。'},
            {'name': '财务管理', 'category': '管理学', 'description': '培养具备财务管理理论和实践能力的高级管理人才。'},
            {'name': '信息管理', 'category': '管理学', 'description': '培养具备信息管理理论和实践能力的高级管理人才。'}
        ]
        
        added = 0
        for major in majors_list:
            if major['name'] not in existing_majors:
                m = Major(
                    name=major['name'],
                    category=major['category'],
                    description=major['description'],
                    employment=f"{major['name']}专业就业前景良好，可在相关行业从事技术、管理、研究等工作。"
                )
                db.session.add(m)
                added += 1
        
        if added > 0:
            db.session.commit()
        print(f"专业数据: 新增 {added} 条")

def init_knowledge_base(app):
    """初始化知识库数据"""
    with app.app_context():
        # 获取已有内容
        existing_contents = {k.content[:50] for k in KnowledgeBase.query.all()}
        
        knowledge_items = [
            {
                'content': '电子信息类专业就业前景良好，根据麦可思数据，该领域毕业生平均起薪高于全国平均水平15%左右。主要就业方向包括互联网企业、通信运营商、科研院所等。',
                'source': '麦可思就业蓝皮书',
                'keywords': '电子信息,就业,起薪,互联网,通信'
            },
            {
                'content': '计算机类专业是当前热门专业之一，涵盖计算机科学与技术、软件工程、人工智能等方向。毕业生可从事软件开发、数据分析、人工智能等工作。',
                'source': '教育部专业目录',
                'keywords': '计算机,软件,人工智能,开发,数据'
            },
            {
                'content': '机械类专业培养具备机械设计、制造、自动化等方面知识的工程技术人才。就业方向包括制造业、汽车工业、航空航天等领域。',
                'source': '院校官方资料',
                'keywords': '机械,制造,自动化,汽车,航空航天'
            },
            {
                'content': '临床医学专业学制五年，培养从事临床医疗工作的高级医学人才。毕业后需通过执业医师资格考试，可在各级医院、诊所等医疗机构工作。',
                'source': '医学教育指南',
                'keywords': '临床医学,医学,医生,医院,执业医师'
            },
            {
                'content': '金融学专业培养具备金融理论和实践能力的高级金融人才。就业方向包括银行、证券、保险、投资等金融机构。',
                'source': '金融行业报告',
                'keywords': '金融,银行,证券,保险,投资'
            },
            {
                'content': '工商管理专业培养具备管理、经济、法律等方面知识的高级管理人才。就业方向包括企业管理、市场营销、人力资源等领域。',
                'source': '管理学教材',
                'keywords': '工商管理,管理,企业,市场,人力资源'
            },
            {
                'content': '建筑学专业培养具备建筑设计、城市规划等方面知识的高级工程技术人才。学制五年，毕业后可从事建筑设计、城市规划、景观设计等工作。',
                'source': '建筑学专业介绍',
                'keywords': '建筑学,建筑设计,城市规划,景观'
            },
            {
                'content': '自动化专业培养从事工业自动化控制、智能系统设计等工作的高级工程技术人才。就业方向包括智能制造、机器人、物联网等领域。',
                'source': '自动化协会',
                'keywords': '自动化,智能制造,机器人,物联网'
            },
            {
                'content': '师范类专业培养具备教育理论和实践能力的高级教育人才。毕业后可在中小学、幼儿园等教育机构从事教学工作。',
                'source': '师范教育指南',
                'keywords': '师范,教育,教师,中小学,教学'
            },
            {
                'content': '985高校是中国顶尖大学的代表，拥有优质的师资力量和科研资源。毕业生在就业市场上具有较强的竞争力，起薪普遍较高。',
                'source': '高校评估报告',
                'keywords': '985,高校,顶尖大学,就业,竞争力'
            },
            {
                'content': '211高校是国家重点建设的大学，在学科建设和人才培养方面具有优势。毕业生就业前景良好，受到用人单位的青睐。',
                'source': '高校评估报告',
                'keywords': '211,高校,重点建设,就业'
            },
            {
                'content': '双一流高校是国家新一轮重点建设的大学和学科，旨在提升中国高等教育的国际竞争力。包括一流大学建设高校和一流学科建设高校。',
                'source': '双一流建设方案',
                'keywords': '双一流,重点建设,学科,国际竞争力'
            }
        ]
        
        added = 0
        for item in knowledge_items:
            if item['content'][:50] not in existing_contents:
                k = KnowledgeBase(
                    content=item['content'],
                    source=item['source'],
                    keywords=item['keywords']
                )
                db.session.add(k)
                added += 1
        
        if added > 0:
            db.session.commit()
        print(f"知识库数据: 新增 {added} 条")

def main():
    """主函数"""
    print("=" * 50)
    print("高考志愿填报APP - 数据库初始化")
    print("=" * 50)
    
    # 创建应用
    app = create_app('default')
    
    # 加载JSON数据
    print("\n加载JSON数据...")
    gk_db = load_json_data()
    print(f"JSON数据加载完成，共 {len(gk_db.get('provinces', []))} 个省份")
    
    # 初始化数据
    print("\n初始化省份数据...")
    init_provinces(app, gk_db)
    
    print("\n初始化院校数据...")
    init_schools(app, gk_db)
    
    print("\n初始化专业数据...")
    init_majors(app)
    
    print("\n初始化知识库数据...")
    init_knowledge_base(app)
    
    print("\n" + "=" * 50)
    print("数据库初始化完成！")
    print("=" * 50)

if __name__ == '__main__':
    main()
