#!/usr/bin/env python3
"""
数据摄入脚本 - 将高考志愿填报数据库的Markdown文件导入Chroma向量库

执行方式：python ingest_docs.py [--clear]
  --clear: 清空现有向量库重新导入
"""

import os
import sys

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from chroma_rag import ChromaRAG

def main():
    """主函数"""
    print("=" * 60)
    print("高考志愿填报APP - RAG数据摄入")
    print("=" * 60)

    # 解析命令行参数
    clear_flag = '--clear' in sys.argv

    # 知识库目录
    docs_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        '..',
        '高考志愿填报数据库'
    )

    print(f"知识库目录: {docs_dir}")

    if not os.path.exists(docs_dir):
        print(f"错误：知识库目录不存在: {docs_dir}")
        sys.exit(1)

    # 创建RAG引擎
    persist_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        'chroma_db'
    )

    print(f"向量库持久化目录: {persist_dir}")
    print("\n初始化RAG引擎...")

    rag = ChromaRAG(persist_dir=persist_dir)

    # 获取当前统计
    stats = rag.get_collection_stats()
    print(f"当前向量库统计: {stats}")

    # 是否清空现有数据
    if clear_flag:
        print("\n清空现有向量库...")
        rag.clear_collection()
        # 清空后需要删除旧的tfidf vectorizer
        tfidf_path = os.path.join(persist_dir, 'tfidf_vectorizer.pkl')
        if os.path.exists(tfidf_path):
            os.remove(tfidf_path)
            print("已删除旧的TF-IDF vectorizer")
        rag = ChromaRAG(persist_dir=persist_dir)
        print("向量库已清空")

    # 开始摄入
    print("\n开始摄入文档...")
    print("=" * 60)

    total_added = rag.ingest_docs(docs_dir)

    print("\n" + "=" * 60)
    print(f"摄入完成！")
    print(f"新增chunk数量: {total_added}")

    # 获取最终统计
    stats = rag.get_collection_stats()
    print(f"最终向量库统计: {stats}")

    # 测试检索
    print("\n测试检索功能...")
    test_queries = [
        "广东物理类600分能上什么大学",
        "四川大学2025年录取分数线",
        "计算机专业选科要求"
    ]

    for query in test_queries:
        results = rag.search(query, n_results=3)
        print(f"\n查询: '{query}'")
        print(f"返回结果: {len(results)} 条")
        if results:
            for i, result in enumerate(results[:2]):
                source = result['metadata'].get('source_file', '未知')
                print(f"  - 结果{i+1}: 相似度 {result['score']:.3f}, 来源: {os.path.basename(source)}")

    print("\n" + "=" * 60)
    print("数据摄入和测试完成！")
    print("=" * 60)

if __name__ == '__main__':
    main()
