#!/usr/bin/env python3
"""
轻量版RAG引擎 - 纯TF-IDF实现（无需chromadb和sentence-transformers）
依赖：scikit-learn, numpy
"""
import os
import json
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class SimpleRAG:
    """纯TF-IDF RAG引擎（轻量、快速、稳定）"""

    def __init__(self, data_dir=None):
        self.data_dir = data_dir or os.path.dirname(os.path.abspath(__file__))
        self.chunks = []
        self.vectorizer = None
        self.doc_matrix = None
        self._loaded = False

        self._load_data()

    def _load_data(self):
        """加载文档数据和TF-IDF向量化器"""
        data_file = os.path.join(self.data_dir, 'rag_data.json')
        vectorizer_file = os.path.join(self.data_dir, 'tfidf_vectorizer.pkl')

        # 加载文档
        if os.path.exists(data_file):
            with open(data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self.chunks = data.get('chunks', [])
            print(f"[RAG] 加载文档块: {len(self.chunks)} 个")

        # 加载或创建向量化器
        if os.path.exists(vectorizer_file) and self.chunks:
            with open(vectorizer_file, 'rb') as f:
                self.vectorizer = pickle.load(f)
            print("[RAG] 加载已有TF-IDF向量化器")
        elif self.chunks:
            # 重新训练
            self._train_vectorizer()

        # 构建文档矩阵
        if self.vectorizer and self.chunks:
            documents = [c['content'] for c in self.chunks]
            self.doc_matrix = self.vectorizer.transform(documents)
            self._loaded = True
            print(f"[RAG] 文档矩阵构建完成: {self.doc_matrix.shape}")

    def _train_vectorizer(self):
        """训练TF-IDF向量化器"""
        documents = [c['content'] for c in self.chunks]
        print(f"[RAG] 训练TF-IDF向量化器（{len(documents)}个文档）...")

        self.vectorizer = TfidfVectorizer(
            max_features=2048,
            analyzer='char_wb',
            ngram_range=(2, 4),
            min_df=1,
            max_df=0.95
        )
        self.doc_matrix = self.vectorizer.fit_transform(documents)

        # 保存
        vectorizer_file = os.path.join(self.data_dir, 'tfidf_vectorizer.pkl')
        with open(vectorizer_file, 'wb') as f:
            pickle.dump(self.vectorizer, f)

        print(f"[RAG] 向量化器训练完成，词汇表大小: {len(self.vectorizer.vocabulary_)}")

    def search(self, query, n_results=5):
        """检索最相关的n_results个文档块"""
        if not self._loaded:
            return []

        # 转换查询为向量
        query_vector = self.vectorizer.transform([query])

        # 计算余弦相似度
        similarities = cosine_similarity(query_vector, self.doc_matrix).flatten()

        # 取top N
        top_indices = similarities.argsort()[::-1][:n_results]

        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            if score > 0.01:  # 过滤掉完全不相关的
                chunk = self.chunks[idx]
                results.append({
                    "content": chunk['content'],
                    "metadata": chunk.get('metadata', {}),
                    "score": round(score, 4),
                    "source": chunk.get('metadata', {}).get('source_file', ''),
                })

        return results


# 全局实例
_rag_instance = None


def init_rag(data_dir=None):
    """初始化全局RAG引擎"""
    global _rag_instance
    if data_dir is None:
        data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)))
    _rag_instance = SimpleRAG(data_dir=data_dir)
    return _rag_instance


def get_rag():
    """获取全局RAG引擎"""
    return _rag_instance
