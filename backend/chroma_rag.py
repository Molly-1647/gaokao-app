#!/usr/bin/env python3
"""
RAG引擎模块 - 方案一：文件级RAG（轻量）

技术组件：
- 向量库：Chroma（本地持久化）
- Embedding模型：BGE-M3（优先）/ TF-IDF（离线后备）
- 分块策略：递归分块，每块512 tokens，重叠10%
"""

import os
import re
import json
import hashlib
import pickle
from pathlib import Path

# 设置HuggingFace镜像（解决国内网络访问问题）
os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
os.environ['HF_HUB_ENABLE_HF_TRANSFER'] = '0'

try:
    import chromadb
    from chromadb.config import Settings
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("警告：未安装RAG依赖，请运行 pip install chromadb sentence-transformers")
    chromadb = None
    SentenceTransformer = None

from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np


class ChromaRAG:
    """Chroma向量库RAG引擎（支持BGE-M3和TF-IDF双模式）"""

    def __init__(self, persist_dir="chroma_db", model_name="BAAI/bge-m3"):
        """初始化RAG引擎（延迟加载模型，避免阻塞启动）"""
        self.persist_dir = persist_dir
        self.model_name = model_name
        self.chroma_client = None
        self.collection = None
        self.embedding_model = None
        self._model_loaded = False
        self._model_load_attempted = False
        self.use_tfidf = False
        self.tfidf_vectorizer = None
        self.tfidf_model_path = os.path.join(persist_dir, 'tfidf_vectorizer.pkl')

        if chromadb:
            self._init_chroma()
            # 尝试加载已保存的TF-IDF vectorizer
            self._load_tfidf_vectorizer()

    def _init_chroma(self):
        """初始化Chroma向量库"""
        self.chroma_client = chromadb.PersistentClient(
            path=self.persist_dir,
            settings=Settings(
                anonymized_telemetry=False,
                is_persistent=True
            )
        )
        self.collection = self.chroma_client.get_or_create_collection(
            name="gaokao_knowledge",
            metadata={"hnsw:space": "cosine"}
        )

    def _init_model(self):
        """初始化BGE-M3 Embedding模型"""
        print(f"加载Embedding模型: {self.model_name}")
        self.embedding_model = SentenceTransformer(
            self.model_name,
            device="cuda" if os.environ.get("USE_GPU") else "cpu"
        )
        print("BGE-M3模型加载完成")

    def _init_tfidf(self):
        """初始化TF-IDF向量化器"""
        print("切换到TF-IDF离线模式（无需下载模型）")
        self.use_tfidf = True
        self._model_loaded = True

    def _ensure_model_loaded(self):
        """确保模型已加载（延迟加载，BGE-M3优先，TF-IDF后备）"""
        if self._model_loaded:
            return True

        if self._model_load_attempted:
            return self.use_tfidf

        self._model_load_attempted = True

        # 如果环境变量强制TF-IDF，直接使用
        if os.environ.get('FORCE_TFIDF') == '1':
            print("强制使用TF-IDF模式（FORCE_TFIDF=1）")
            self._init_tfidf()
            return True

        # 尝试加载BGE-M3模型
        if SentenceTransformer:
            try:
                self._init_model()
                self._model_loaded = True
                return True
            except Exception as e:
                print(f"BGE-M3模型加载失败（网络不可用）: {e}")
                print("自动切换到TF-IDF离线模式...")

        # 后备：使用TF-IDF
        self._init_tfidf()
        return True

    def _load_tfidf_vectorizer(self):
        """加载已保存的TF-IDF vectorizer"""
        if os.path.exists(self.tfidf_model_path):
            try:
                with open(self.tfidf_model_path, 'rb') as f:
                    self.tfidf_vectorizer = pickle.load(f)
                print("已加载TF-IDF vectorizer")
                self.use_tfidf = True
                self._model_loaded = True
            except Exception as e:
                print(f"加载TF-IDF vectorizer失败: {e}")

    def _save_tfidf_vectorizer(self):
        """保存TF-IDF vectorizer到磁盘"""
        if self.tfidf_vectorizer:
            os.makedirs(os.path.dirname(self.tfidf_model_path), exist_ok=True)
            with open(self.tfidf_model_path, 'wb') as f:
                pickle.dump(self.tfidf_vectorizer, f)
            print(f"TF-IDF vectorizer已保存到: {self.tfidf_model_path}")

    def _embed_text(self, text):
        """将文本转为向量（BGE-M3或TF-IDF）"""
        if self.use_tfidf:
            if self.tfidf_vectorizer:
                vec = self.tfidf_vectorizer.transform([text]).toarray()[0]
                return vec.tolist()
            return None
        elif self.embedding_model:
            return self.embedding_model.encode(text).tolist()
        return None

    def _embed_texts_batch(self, texts):
        """批量将文本转为向量"""
        if self.use_tfidf:
            if self.tfidf_vectorizer:
                vecs = self.tfidf_vectorizer.transform(texts).toarray()
                return vecs.tolist()
            return None
        elif self.embedding_model:
            return self.embedding_model.encode(texts).tolist()
        return None

    def _extract_metadata_from_path(self, file_path):
        """从文件路径提取元数据"""
        parts = file_path.split(os.sep)
        metadata = {
            "source_file": file_path,
            "category": None,
            "year": None,
            "province": None,
            "subject_type": None
        }

        # 提取category（目录名）
        for part in parts:
            if part.startswith(('01_', '02_', '03_', '04_')):
                metadata["category"] = part
                break

        # 提取year（2025或2026）
        for part in parts:
            if re.match(r'^202[56]$', part):
                metadata["year"] = int(part)
                break

        # 提取province（从文件名中）
        province_map = {
            '广东': ['广东', '广'], '北京': ['北京', '京'], '上海': ['上海', '沪'],
            '江苏': ['江苏', '苏'], '浙江': ['浙江', '浙'], '山东': ['山东', '鲁'],
            '四川': ['四川', '川'], '湖北': ['湖北', '鄂'], '湖南': ['湖南', '湘'],
            '河南': ['河南', '豫'], '河北': ['河北', '冀'], '安徽': ['安徽', '皖'],
            '福建': ['福建', '闽'], '江西': ['江西', '赣'], '重庆': ['重庆', '渝'],
            '陕西': ['陕西', '陕'], '天津': ['天津', '津'], '辽宁': ['辽宁', '辽'],
            '山西': ['山西', '晋'], '黑龙江': ['黑龙江', '黑'], '吉林': ['吉林', '吉'],
            '云南': ['云南', '滇'], '贵州': ['贵州', '黔'], '广西': ['广西', '桂'],
            '新疆': ['新疆', '新'], '甘肃': ['甘肃', '甘'], '内蒙古': ['内蒙古'],
            '海南': ['海南', '琼'], '宁夏': ['宁夏', '宁'], '青海': ['青海', '青'],
            '西藏': ['西藏', '藏']
        }

        file_name = parts[-1] if parts else ""
        for province, keywords in province_map.items():
            if any(k in file_name for k in keywords):
                metadata["province"] = province
                break

        # 提取subject_type（物理类/历史类）
        if '物理' in file_name or '理科' in file_name:
            metadata["subject_type"] = "物理类"
        elif '历史' in file_name or '文科' in file_name:
            metadata["subject_type"] = "历史类"

        return metadata

    def _parse_markdown(self, content, file_path):
        """解析Markdown文件"""
        sections = []
        current_title_path = []
        current_content = ""

        lines = content.split('\n')

        for line in lines:
            # 处理标题
            if line.startswith('#'):
                # 保存当前段落
                if current_content.strip():
                    sections.append({
                        "title_path": ' > '.join(current_title_path),
                        "content": current_content.strip()
                    })

                # 更新标题路径
                level = len(line) - len(line.lstrip('#'))
                title_text = line.lstrip('#').strip()
                current_title_path = current_title_path[:level-1] + [title_text]
                current_content = ""
            else:
                current_content += line + '\n'

        # 保存最后一段
        if current_content.strip():
            sections.append({
                "title_path": ' > '.join(current_title_path),
                "content": current_content.strip()
            })

        return sections

    def _convert_table_to_text(self, table_content):
        """将Markdown表格转换为可读文本"""
        lines = table_content.strip().split('\n')
        if len(lines) < 3:
            return table_content

        # 提取表头和分隔线
        header = lines[0].strip().strip('|').split('|')
        header = [h.strip() for h in header]

        # 提取数据行
        data_rows = []
        for line in lines[2:]:
            if line.strip().startswith('|'):
                cells = line.strip().strip('|').split('|')
                cells = [c.strip() for c in cells]
                if len(cells) == len(header):
                    row_dict = dict(zip(header, cells))
                    data_rows.append(row_dict)

        # 转换为可读文本
        result = ""
        for i, row in enumerate(data_rows):
            if i > 0:
                result += "\n"
            for key, value in row.items():
                if value:
                    result += f"{key}: {value}；"

        return result.strip('；')

    def _split_into_chunks(self, content, chunk_size=512, overlap_ratio=0.1):
        """递归分块：512 tokens，重叠10%"""
        overlap = int(chunk_size * overlap_ratio)
        chunks = []

        # 按段落分割
        paragraphs = re.split(r'\n\n+', content)

        current_chunk = ""
        current_length = 0

        for paragraph in paragraphs:
            # 检查是否包含表格
            if '|' in paragraph:
                # 将表格转换为文本
                paragraph = self._convert_table_to_text(paragraph)

            # 计算段落长度（按字符估算，中文1字符≈1 token）
            para_length = len(paragraph)

            if current_length + para_length <= chunk_size:
                # 段落可以放入当前chunk
                if current_chunk:
                    current_chunk += "\n\n"
                current_chunk += paragraph
                current_length = len(current_chunk)
            else:
                # 段落放不下，先保存当前chunk
                if current_chunk:
                    chunks.append(current_chunk)

                # 如果段落本身超过chunk_size，需要进一步分割
                if para_length > chunk_size:
                    # 按句子分割
                    sentences = re.split(r'([。！？；]\s*)', paragraph)
                    sentence_parts = []
                    current_sentence = ""

                    for i, part in enumerate(sentences):
                        if i % 2 == 0:
                            # 句子内容
                            if len(current_sentence) + len(part) <= chunk_size:
                                current_sentence += part
                            else:
                                if current_sentence:
                                    sentence_parts.append(current_sentence)
                                    # 重叠部分
                                    overlap_text = current_sentence[-overlap:] if len(current_sentence) > overlap else current_sentence
                                    current_sentence = overlap_text + part
                                else:
                                    current_sentence = part
                        else:
                            # 标点符号
                            current_sentence += part

                    if current_sentence:
                        sentence_parts.append(current_sentence)

                    chunks.extend(sentence_parts)
                    current_chunk = ""
                    current_length = 0
                else:
                    current_chunk = paragraph
                    current_length = para_length

        # 保存最后一个chunk
        if current_chunk:
            chunks.append(current_chunk)

        return chunks

    def _compute_chunk_hash(self, content, metadata):
        """计算chunk的唯一哈希值"""
        hash_str = f"{content[:200]}_{json.dumps(metadata, sort_keys=True)}"
        return hashlib.md5(hash_str.encode()).hexdigest()

    def _collect_chunks_from_file(self, file_path):
        """从单个文件收集所有chunks（不向量化）"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"读取文件失败 {file_path}: {e}")
            return []

        # 解析Markdown
        sections = self._parse_markdown(content, file_path)

        # 提取元数据
        base_metadata = self._extract_metadata_from_path(file_path)

        chunks_data = []

        for section in sections:
            # 组合标题和内容
            full_content = f"{section['title_path']}\n\n{section['content']}"

            # 分块
            chunks = self._split_into_chunks(full_content)

            for chunk in chunks:
                # 计算chunk哈希
                chunk_hash = self._compute_chunk_hash(chunk, base_metadata)

                # 检查是否已存在
                existing = self.collection.get(ids=[chunk_hash])
                if existing['ids']:
                    continue

                # 构建完整元数据（Chroma不接受None值，用空字符串替代）
                metadata = {
                    **{k: (v if v is not None else "") for k, v in base_metadata.items()},
                    "chunk_hash": chunk_hash,
                    "title_path": section['title_path'] or ""
                }

                chunks_data.append({
                    "id": chunk_hash,
                    "document": chunk,
                    "metadata": metadata
                })

        return chunks_data

    def ingest_docs(self, docs_dir):
        """批量摄入目录下所有Markdown文件"""
        if not self.collection or not self._ensure_model_loaded():
            print("错误：RAG引擎未初始化或模型加载失败")
            return 0

        print(f"开始摄入文档，目录: {docs_dir}")

        # 第一步：收集所有文件中的chunks
        all_chunks = []
        file_count = 0

        for root, dirs, files in os.walk(docs_dir):
            for file in files:
                if file.endswith('.md'):
                    file_path = os.path.join(root, file)
                    print(f"处理文件: {os.path.basename(file_path)}")

                    chunks_data = self._collect_chunks_from_file(file_path)
                    all_chunks.extend(chunks_data)
                    file_count += 1

        if not all_chunks:
            print("没有新的chunks需要摄入（可能已全部导入）")
            return 0

        print(f"共收集 {len(all_chunks)} 个新chunks，开始向量化...")

        # 第二步：向量化并存入Chroma
        if self.use_tfidf:
            # TF-IDF模式：需要先fit vectorizer
            # 收集所有已有文档 + 新文档来fit
            existing_docs = []
            existing_count = self.collection.count()
            if existing_count > 0:
                existing_data = self.collection.get(include=["documents"])
                existing_docs = existing_data['documents']

            # 合并已有文档和新文档
            all_texts = existing_docs + [c['document'] for c in all_chunks]

            # 创建并fit TfidfVectorizer（使用字符级n-gram，适合中文）
            print("训练TF-IDF向量化器...")
            self.tfidf_vectorizer = TfidfVectorizer(
                max_features=2048,
                analyzer='char_wb',
                ngram_range=(2, 4),
                min_df=1,
                max_df=0.95
            )
            self.tfidf_vectorizer.fit(all_texts)
            print(f"TF-IDF向量化器训练完成，词汇表大小: {len(self.tfidf_vectorizer.vocabulary_)}")

            # 保存vectorizer
            self._save_tfidf_vectorizer()

            # 如果有已有文档，需要重新向量化（因为vectorizer变了）
            if existing_count > 0:
                print(f"重新向量化 {existing_count} 个已有文档...")
                # 删除旧数据
                self.clear_collection()
                # 重新添加所有文档
                all_chunks_to_add = []
                for text, doc_data in zip(existing_docs, existing_data['metadatas']):
                    chunk_hash = self._compute_chunk_hash(text, doc_data)
                    all_chunks_to_add.append({
                        "id": chunk_hash,
                        "document": text,
                        "metadata": doc_data
                    })
                all_chunks = all_chunks_to_add + all_chunks

            # 批量向量化新文档（先去重）
            seen_ids = set()
            unique_chunks = []
            for chunk in all_chunks:
                if chunk['id'] not in seen_ids:
                    seen_ids.add(chunk['id'])
                    unique_chunks.append(chunk)
            all_chunks = unique_chunks
            print(f"去重后剩余 {len(all_chunks)} 个chunks")

            batch_size = 100
            total_added = 0

            for i in range(0, len(all_chunks), batch_size):
                batch = all_chunks[i:i + batch_size]
                texts = [c['document'] for c in batch]
                embeddings = self.tfidf_vectorizer.transform(texts).toarray().tolist()

                self.collection.add(
                    ids=[c['id'] for c in batch],
                    embeddings=embeddings,
                    documents=texts,
                    metadatas=[c['metadata'] for c in batch]
                )
                total_added += len(batch)
                print(f"  已添加 {total_added}/{len(all_chunks)} 个chunks")

        else:
            # BGE-M3模式：逐个向量化
            total_added = 0
            for chunk_data in all_chunks:
                embedding = self.embedding_model.encode(chunk_data['document']).tolist()

                self.collection.add(
                    ids=[chunk_data['id']],
                    embeddings=[embedding],
                    documents=[chunk_data['document']],
                    metadatas=[chunk_data['metadata']]
                )
                total_added += 1

                if total_added % 50 == 0:
                    print(f"  已添加 {total_added}/{len(all_chunks)} 个chunks")

        print(f"摄入完成，共处理 {file_count} 个文件，新增 {total_added} 个chunk")
        return total_added

    def search(self, query, n_results=20, filter_metadata=None):
        """从向量库检索相关文档"""
        if not self.collection or not self._ensure_model_loaded():
            print("错误：RAG引擎未初始化或模型加载失败")
            return []

        # 向量化查询
        query_embedding = self._embed_text(query)
        if not query_embedding:
            print("错误：无法生成查询向量")
            return []

        # 构建过滤条件
        where_clause = {}
        if filter_metadata:
            for key, value in filter_metadata.items():
                if value:
                    where_clause[key] = value

        # 检索
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_clause if where_clause else None,
            include=["documents", "metadatas", "distances"]
        )

        # 整理结果
        retrieved = []
        if results['documents'] and results['documents'][0]:
            for i, (doc, metadata, distance) in enumerate(zip(
                results['documents'][0],
                results['metadatas'][0],
                results['distances'][0]
            )):
                retrieved.append({
                    "content": doc,
                    "metadata": metadata,
                    "score": 1 - distance,  # 转换为相似度分数
                    "rank": i + 1
                })

        return retrieved

    def get_collection_stats(self):
        """获取向量库统计信息"""
        if not self.collection:
            return {"error": "向量库未初始化"}

        count = self.collection.count()
        return {
            "total_chunks": count,
            "persist_dir": self.persist_dir,
            "mode": "TF-IDF" if self.use_tfidf else "BGE-M3"
        }

    def clear_collection(self):
        """清空向量库"""
        if self.collection:
            self.chroma_client.delete_collection(name="gaokao_knowledge")
            self._init_chroma()
            print("向量库已清空")


# 全局RAG实例
rag_engine = None

def init_rag(persist_dir=None):
    """初始化全局RAG引擎"""
    global rag_engine

    if persist_dir is None:
        persist_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'chroma_db')

    rag_engine = ChromaRAG(persist_dir=persist_dir)
    return rag_engine

def get_rag():
    """获取全局RAG引擎实例"""
    return rag_engine

def build_query_text(user_input):
    """根据用户输入构建查询文本"""
    query_parts = []

    if isinstance(user_input, dict):
        # 从字典中提取信息
        if user_input.get('province'):
            query_parts.append(user_input['province'])
        if user_input.get('subject_type') or user_input.get('mode'):
            query_parts.append(user_input.get('subject_type', user_input.get('mode', '')))
        if user_input.get('score'):
            query_parts.append(f"{user_input['score']}分")
        if user_input.get('rank'):
            query_parts.append(f"位次{user_input['rank']}")
        if user_input.get('major') or user_input.get('majorPreferences'):
            majors = user_input.get('major', '')
            if user_input.get('majorPreferences'):
                majors += ' ' + ' '.join(user_input['majorPreferences'])
            query_parts.append(majors)
        if user_input.get('year'):
            query_parts.append(f"{user_input['year']}年")
    else:
        # 直接使用文本
        query_parts.append(str(user_input))

    # 添加通用关键词
    query_parts.extend(["录取位次", "招生计划", "冲稳保", "分数线"])

    return ' '.join(filter(None, query_parts))

def format_context_for_prompt(retrieved_chunks):
    """将检索结果格式化为Prompt上下文"""
    if not retrieved_chunks:
        return ""

    # 按U型注意力排列：最高分3个放前面，次高分3个放后面，其余放中间
    sorted_chunks = sorted(retrieved_chunks, key=lambda x: x['score'], reverse=True)

    top3 = sorted_chunks[:3]
    middle = sorted_chunks[3:-3] if len(sorted_chunks) > 6 else []
    bottom3 = sorted_chunks[-3:] if len(sorted_chunks) > 3 else []

    u_order = top3 + middle + bottom3

    context_parts = []
    for chunk in u_order:
        source = chunk['metadata'].get('source_file', '未知来源')
        year = chunk['metadata'].get('year', '')
        province = chunk['metadata'].get('province', '')
        subject_type = chunk['metadata'].get('subject_type', '')

        source_info = []
        if year:
            source_info.append(f"{year}年")
        if province:
            source_info.append(province)
        if subject_type:
            source_info.append(subject_type)

        header = f"【来源：{source}】"
        if source_info:
            header += f"（{'、'.join(source_info)}）"

        context_parts.append(f"{header}\n{chunk['content']}\n")

    return '\n'.join(context_parts)
