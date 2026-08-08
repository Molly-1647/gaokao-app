#!/usr/bin/env python3
"""
后端API测试脚本
验证所有API接口是否正常工作
"""

import requests
import json
import sys

BASE_URL = "http://localhost:5000"

def test_health():
    """测试健康检查接口"""
    print("=" * 60)
    print("测试1: 健康检查 /api/health")
    print("-" * 60)
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ 状态码: {response.status_code}")
            print(f"✓ 响应: {json.dumps(data, ensure_ascii=False)}")
            return True
        else:
            print(f"✗ 状态码: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("✗ 无法连接到后端服务，请确保服务已启动")
        return False
    except Exception as e:
        print(f"✗ 错误: {str(e)}")
        return False

def test_provinces():
    """测试省份列表接口"""
    print("\n" + "=" * 60)
    print("测试2: 获取省份列表 /api/provinces")
    print("-" * 60)
    try:
        response = requests.get(f"{BASE_URL}/api/provinces", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ 状态码: {response.status_code}")
            print(f"✓ 返回省份数量: {len(data)}")
            if data:
                print(f"✓ 部分省份: {[p['name'] for p in data[:5]]}")
            return True
        else:
            print(f"✗ 状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 错误: {str(e)}")
        return False

def test_schools():
    """测试院校列表接口"""
    print("\n" + "=" * 60)
    print("测试3: 获取院校列表 /api/schools")
    print("-" * 60)
    try:
        response = requests.get(f"{BASE_URL}/api/schools?province=广东", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ 状态码: {response.status_code}")
            print(f"✓ 广东省院校数量: {len(data)}")
            if data:
                print(f"✓ 示例院校: {data[0]['school']} (分数: {data[0].get('score', 'N/A')}, 位次: {data[0].get('rank', 'N/A')})")
            return True
        else:
            print(f"✗ 状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 错误: {str(e)}")
        return False

def test_recommend():
    """测试志愿推荐接口"""
    print("\n" + "=" * 60)
    print("测试4: 志愿推荐 /api/recommend")
    print("-" * 60)
    try:
        data = {
            "province": "广东",
            "rank": 50000,
            "weights": {"major": 34, "school": 33, "city": 33},
            "score": 580
        }
        response = requests.post(f"{BASE_URL}/api/recommend", json=data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            print(f"✓ 状态码: {response.status_code}")
            print(f"✓ 冲刺院校: {len(result.get('sprint', []))} 所")
            print(f"✓ 稳妥院校: {len(result.get('stable', []))} 所")
            print(f"✓ 保底院校: {len(result.get('safe', []))} 所")
            if result.get('sprint'):
                print(f"✓ 冲刺示例: {result['sprint'][0]['school']} (匹配度: {result['sprint'][0]['match']}%)")
            return True
        else:
            print(f"✗ 状态码: {response.status_code}")
            print(f"✗ 错误信息: {response.text}")
            return False
    except Exception as e:
        print(f"✗ 错误: {str(e)}")
        return False

def test_generate_plan():
    """测试生成完整方案接口"""
    print("\n" + "=" * 60)
    print("测试5: 生成完整方案 /api/generate_plan")
    print("-" * 60)
    try:
        data = {
            "province": "广东",
            "rank": 50000,
            "weights": {"major": 34, "school": 33, "city": 33},
            "score": 580,
            "quiz": ["R", "I", "A"],
            "likeMajors": ["计算机类", "电子信息类"],
            "dislikeMajors": ["临床医学"]
        }
        response = requests.post(f"{BASE_URL}/api/generate_plan", json=data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            print(f"✓ 状态码: {response.status_code}")
            print(f"✓ 方案概览: {result.get('overview', {})}")
            print(f"✓ 是否包含决策解释: {'decision' in result}")
            
            # 检查每个学校是否包含RAG相关信息
            has_rag = False
            for tier in ['sprint', 'stable', 'safe']:
                for school in result.get(tier, []):
                    if school.get('rag'):
                        has_rag = True
                        print(f"✓ 学校 {school['school']} 包含RAG引用: {school['rag']}")
                        break
                if has_rag:
                    break
            
            if not has_rag:
                print("✗ 未找到RAG引用")
            
            return True
        else:
            print(f"✗ 状态码: {response.status_code}")
            print(f"✗ 错误信息: {response.text}")
            return False
    except Exception as e:
        print(f"✗ 错误: {str(e)}")
        return False

def test_holland():
    """测试霍兰德测试接口"""
    print("\n" + "=" * 60)
    print("测试6: 霍兰德测试 /api/holland/quiz 和 /api/holland/analyze")
    print("-" * 60)
    try:
        # 获取测试题
        response = requests.get(f"{BASE_URL}/api/holland/quiz", timeout=5)
        if response.status_code == 200:
            quiz = response.json()
            print(f"✓ 获取测试题成功，共 {len(quiz)} 题")
            
            # 分析测试结果
            answers = ["R", "I", "R", "I", "A"]
            response = requests.post(f"{BASE_URL}/api/holland/analyze", json={"answers": answers}, timeout=5)
            if response.status_code == 200:
                result = response.json()
                print(f"✓ 分析结果成功")
                print(f"✓ 霍兰德代码: {result['code']}")
                print(f"✓ 推荐专业: {result['suggestions']}")
                return True
            else:
                print(f"✗ 分析接口状态码: {response.status_code}")
                return False
        else:
            print(f"✗ 获取测试题状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 错误: {str(e)}")
        return False

def test_rag_search():
    """测试RAG知识库检索接口（Chroma向量库版本）"""
    print("\n" + "=" * 60)
    print("测试7: RAG知识库检索 /api/rag/search")
    print("-" * 60)
    try:
        test_queries = [
            {"query": "广东物理类600分能上什么大学", "province": "广东"},
            {"query": "四川大学2025年录取分数线"},
            {"query": "计算机专业选科要求"},
            {"query": "985高校招生计划", "year": 2026}
        ]
        
        has_chroma_results = False
        
        for test_case in test_queries:
            query = test_case['query']
            params = {"query": query}
            if test_case.get('province'):
                params['province'] = test_case['province']
            if test_case.get('year'):
                params['year'] = test_case['year']
            
            response = requests.post(f"{BASE_URL}/api/rag/search", json=params, timeout=10)
            if response.status_code == 200:
                result = response.json()
                results = result.get('results', [])
                print(f"✓ 查询 '{query}' 成功，返回 {len(results)} 条结果")
                
                if results:
                    for i, res in enumerate(results[:2]):
                        source = res.get('source', '未知来源')
                        score = res.get('score', 'N/A')
                        content_preview = res.get('content', '')[:60] + '...'
                        print(f"  - 结果{i+1}: 相似度 {score}, 来源: {source}")
                        print(f"    内容预览: {content_preview}")
                    
                    # 检查是否有真实来源（非模拟数据）
                    for res in results:
                        source = res.get('source', '')
                        if '麦可思' not in source and '教育部' not in source and '院校官方' not in source:
                            has_chroma_results = True
                            break
            else:
                print(f"✗ 查询 '{query}' 状态码: {response.status_code}")
                return False
        
        if has_chroma_results:
            print("\n✓ RAG检索使用了Chroma向量库（检测到真实知识库来源）")
        else:
            print("\n⚠️ RAG检索使用了模拟数据（未检测到真实知识库来源，可能未初始化向量库）")
        
        return True
    except Exception as e:
        print(f"✗ 错误: {str(e)}")
        return False

def test_user_data():
    """测试用户数据接口"""
    print("\n" + "=" * 60)
    print("测试8: 用户数据保存与加载 /api/user/save 和 /api/user/load")
    print("-" * 60)
    try:
        # 保存用户数据
        user_data = {
            "province": "广东",
            "rank": 50000,
            "score": 580,
            "mode": "物理",
            "first": "物理",
            "track": "物化生",
            "category": "普通类",
            "weights": {"major": 34, "school": 33, "city": 33},
            "quiz": ["R", "I", "A"],
            "likeMajors": ["计算机类", "电子信息类"],
            "dislikeMajors": ["临床医学"]
        }
        response = requests.post(f"{BASE_URL}/api/user/save", json=user_data, timeout=5)
        if response.status_code == 200:
            result = response.json()
            print(f"✓ 保存用户数据成功: {result.get('message', '')}")
            
            # 加载用户数据
            response = requests.get(f"{BASE_URL}/api/user/load", timeout=5)
            if response.status_code == 200:
                loaded_data = response.json()
                print(f"✓ 加载用户数据成功")
                print(f"✓ 省份: {loaded_data.get('province', 'N/A')}")
                print(f"✓ 位次: {loaded_data.get('rank', 'N/A')}")
                print(f"✓ 喜欢的专业: {loaded_data.get('likeMajors', [])}")
                return True
            else:
                print(f"✗ 加载接口状态码: {response.status_code}")
                return False
        else:
            print(f"✗ 保存接口状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 错误: {str(e)}")
        return False

def main():
    """主函数"""
    print("=" * 60)
    print("高考志愿填报APP - 后端API测试")
    print("=" * 60)
    print(f"测试地址: {BASE_URL}")
    print("-" * 60)
    
    tests = [
        test_health,
        test_provinces,
        test_schools,
        test_recommend,
        test_generate_plan,
        test_holland,
        test_rag_search,
        test_user_data
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        if test():
            passed += 1
        else:
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"测试结果: {passed} 通过 / {failed} 失败")
    print("=" * 60)
    
    if failed == 0:
        print("\n🎉 所有测试通过！后端服务正常运行。")
        print("\n接下来可以启动前端进行完整测试:")
        print("  cd frontend")
        print("  npm install")
        print("  npm run dev")
    else:
        print("\n⚠️ 部分测试失败，请检查后端服务是否正常启动。")
    
    sys.exit(0 if failed == 0 else 1)

if __name__ == '__main__':
    main()
