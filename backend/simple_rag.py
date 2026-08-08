#!/usr/bin/env python3
"""
极简版RAG引擎 - 纯Python实现（零第三方依赖）
使用字符级N-gram + 词频匹配 + 关键词命中
适用于Python 3.8+，无需numpy/scikit-learn
"""
import os
import json
import re
import math
from collections import Counter


class SimpleRAG:
    """纯Python实现的轻量RAG检索引擎"""

    def __init__(self, data_dir=None):
        self.data_dir = data_dir or os.path.dirname(os.path.abspath(__file__))
        self.chunks = []
        self._loaded = False
        self._index = {}  # token -> {chunk_id: count}
        self._doc_freq = Counter()  # token -> 多少文档包含它
        self._chunk_lens = {}  # chunk_id -> 文档长度(token数)
        self._avg_doc_len = 0.0
        self._token_re = re.compile(r'[\u4e00-\u9fa5a-zA-Z0-9]+')

        self._load_data()

    def _tokenize(self, text):
        """分词：按中英文提取，再生成字符级bigram"""
        tokens = []
        for m in self._token_re.findall(text.lower()):
            # 英文直接加入
            if re.match(r'^[a-zA-Z0-9]+$', m):
                if len(m) >= 2:
                    tokens.append(m)
                if len(m) >= 4:
                    tokens.append(m[:4])  # 前缀
            # 中文生成bigram
            else:
                if len(m) >= 1:
                    tokens.extend(m)  # 单字
                if len(m) >= 2:
                    for i in range(len(m) - 1):
                        tokens.append(m[i:i+2])  # 双字
        return tokens

    def _load_data(self):
        data_file = os.path.join(self.data_dir, 'rag_data.json')
        vectorizer_info = os.path.join(self.data_dir, 'rag_index.json')

        # 加载文档
        if os.path.exists(data_file):
            with open(data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self.chunks = data.get('chunks', [])
            print(f"[RAG] 加载文档块: {len(self.chunks)} 个")
        else:
            print("[RAG] 未找到rag_data.json，RAG功能不可用")
            return

        # 构建或加载索引
        if os.path.exists(vectorizer_info) and self.chunks:
            try:
                with open(vectorizer_info, 'r', encoding='utf-8') as f:
                    idx_data = json.load(f)
                self._doc_freq = Counter(idx_data['doc_freq'])
                self._chunk_lens = {int(k): v for k, v in idx_data['chunk_lens'].items()}
                self._avg_doc_len = idx_data['avg_doc_len']
                print("[RAG] 加载已有检索索引")
                self._loaded = True
                return
            except:
                pass

        # 构建索引
        self._build_index()

        # 保存索引
        try:
            with open(vectorizer_info, 'w', encoding='utf-8') as f:
                json.dump({
                    'doc_freq': dict(self._doc_freq),
                    'chunk_lens': self._chunk_lens,
                    'avg_doc_len': self._avg_doc_len,
                }, f, ensure_ascii=False)
            print("[RAG] 检索索引已保存")
        except:
            pass

        self._loaded = True
        print(f"[RAG] 索引构建完成，词汇量: {len(self._doc_freq)}")

    def _build_index(self):
        N = len(self.chunks)
        total_len = 0

        for chunk_id, chunk in enumerate(self.chunks):
            tokens = self._tokenize(chunk['content'])
            counts = Counter(tokens)
            self._chunk_lens[chunk_id] = len(tokens)
            total_len += len(tokens)

            for tok, cnt in counts.items():
                if tok not in self._index:
                    self._index[tok] = {}
                self._index[tok][chunk_id] = cnt
                self._doc_freq[tok] += 1

        if N > 0:
            self._avg_doc_len = total_len / N

    def search(self, query, n_results=5):
        """BM25-like 检索"""
        if not self._loaded or not self.chunks:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        N = len(self.chunks)
        scores = {}

        k1 = 1.5
        b = 0.75

        for tok in query_tokens:
            if tok not in self._index:
                continue
            doc_freq = self._doc_freq[tok]
            if doc_freq == 0:
                continue
            idf = math.log((N - doc_freq + 0.5) / (doc_freq + 0.5) + 1.0)

            for chunk_id, f in self._index[tok].items():
                dl = self._chunk_lens.get(chunk_id, 1)
                denom = f + k1 * (1 - b + b * dl / max(self._avg_doc_len, 1))
                if denom <= 0:
                    denom = 1
                score_contrib = idf * (f * (k1 + 1)) / denom
                scores[chunk_id] = scores.get(chunk_id, 0.0) + score_contrib

        if not scores:
            return []

        # 排序取top
        top_ids = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:n_results]

        # 归一化分数
        max_score = max(s for _, s in top_ids) or 1.0

        results = []
        for chunk_id, score in top_ids:
            chunk = self.chunks[chunk_id]
            norm_score = round(score / max_score, 4)
            if norm_score >= 0.05:
                results.append({
                    "content": chunk['content'],
                    "metadata": chunk.get('metadata', {}),
                    "score": norm_score,
                    "source": chunk.get('metadata', {}).get('source_file', ''),
                })

        return results


# 全局实例
_rag_instance = None


def init_rag(data_dir=None):
    global _rag_instance
    if data_dir is None:
        data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)))
    _rag_instance = SimpleRAG(data_dir=data_dir)
    return _rag_instance


def get_rag():
    return _rag_instance
