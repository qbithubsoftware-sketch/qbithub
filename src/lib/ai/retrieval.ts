/**
 * Document Retrieval Service — searches existing QBIT Hub modules
 * for relevant context to feed into the AI prompt (RAG pipeline).
 *
 * Reuses data from:
 * - Knowledge Base (articles, FAQs, troubleshooting, error codes)
 * - Download Center (drivers, firmware, SDK, manuals)
 * - Installation Center (guides, steps, tools)
 * - Public Portal (products)
 *
 * Never searches outside QBIT Hub.
 */

import type { SourceDocument, RetrievalResult } from "./types";
import { KNOWLEDGE_ARTICLES, FAQS, TROUBLESHOOTING_ISSUES, COMMON_ERRORS } from "@/lib/knowledge/placeholder-data";
import { DOWNLOADS } from "@/lib/downloads/placeholder-data";
import { PUBLIC_PRODUCTS } from "@/lib/portal/placeholder-data";
import { LATEST_GUIDES } from "@/lib/installation/placeholder-data";

/**
 * Retrieves relevant documents from the QBIT Hub knowledge base
 * based on the user's query.
 *
 * In production, this would use vector embeddings + cosine similarity.
 * For now, it uses keyword matching against the placeholder data.
 */
export async function retrieveDocuments(query: string): Promise<RetrievalResult> {
  const q = query.toLowerCase();
  const sources: SourceDocument[] = [];

  // Search knowledge articles
  for (const article of KNOWLEDGE_ARTICLES) {
    const text = `${article.title} ${article.excerpt} ${article.category.name}`.toLowerCase();
    const relevance = calculateRelevance(q, text);
    if (relevance > 0.1) {
      sources.push({
        sourceType: "article",
        sourceId: article.id,
        title: article.title,
        url: `/knowledge/${article.slug}`,
        excerpt: article.excerpt,
        relevance,
      });
    }
  }

  // Search downloads (drivers, firmware, SDK, manuals) — PUBLIC ONLY
  for (const dl of DOWNLOADS) {
    if (dl.visibility !== "public") continue;
    const text = `${dl.name} ${dl.version} ${dl.category.name} ${dl.description ?? ""}`.toLowerCase();
    const relevance = calculateRelevance(q, text);
    if (relevance > 0.1) {
      sources.push({
        sourceType: dl.category.slug === "manual" ? "manual" : "driver",
        sourceId: dl.id,
        title: `${dl.name} ${dl.version}`,
        url: `/api/downloads/${dl.id}`,
        excerpt: dl.description ?? `${dl.category.name} • ${dl.fileSize} • ${dl.releaseDate}`,
        relevance,
      });
    }
  }

  // Search FAQs
  for (const faq of FAQS) {
    const text = `${faq.question} ${faq.answer}`.toLowerCase();
    const relevance = calculateRelevance(q, text);
    if (relevance > 0.1) {
      sources.push({
        sourceType: "faq",
        sourceId: faq.id,
        title: faq.question,
        excerpt: faq.answer,
        relevance,
      });
    }
  }

  // Search troubleshooting
  for (const issue of TROUBLESHOOTING_ISSUES) {
    const text = `${issue.title} ${issue.symptoms.join(" ")} ${issue.causes.join(" ")} ${issue.resolution}`.toLowerCase();
    const relevance = calculateRelevance(q, text);
    if (relevance > 0.1) {
      sources.push({
        sourceType: "troubleshooting",
        sourceId: issue.id,
        title: issue.title,
        excerpt: issue.resolution,
        relevance,
      });
    }
  }

  // Search error codes
  for (const error of COMMON_ERRORS) {
    const text = `${error.code} ${error.meaning} ${error.possibleCause} ${error.resolution}`.toLowerCase();
    const relevance = calculateRelevance(q, text);
    if (relevance > 0.1) {
      sources.push({
        sourceType: "error_code",
        sourceId: error.id,
        title: `Error ${error.code}: ${error.meaning}`,
        excerpt: `${error.possibleCause} → ${error.resolution}`,
        relevance,
      });
    }
  }

  // Search products
  for (const product of PUBLIC_PRODUCTS) {
    const text = `${product.name} ${product.subtitle} ${product.category}`.toLowerCase();
    const relevance = calculateRelevance(q, text);
    if (relevance > 0.1) {
      sources.push({
        sourceType: "product",
        sourceId: product.id,
        title: product.name,
        excerpt: product.subtitle,
        relevance,
      });
    }
  }

  // Search installation guides
  for (const guide of LATEST_GUIDES) {
    const text = `${guide.title} ${guide.product} ${guide.category}`.toLowerCase();
    const relevance = calculateRelevance(q, text);
    if (relevance > 0.1) {
      sources.push({
        sourceType: "guide",
        sourceId: guide.id,
        title: guide.title,
        excerpt: `${guide.product} • ${guide.estimatedTime} min • ${guide.difficulty}`,
        relevance,
      });
    }
  }

  // Sort by relevance and return top 10
  sources.sort((a, b) => b.relevance - a.relevance);
  const top = sources.slice(0, 10);

  return { sources: top, totalFound: sources.length };
}

// ---------- Relevance scoring (keyword-based, replaceable with embeddings) ----------

/**
 * Calculates a simple relevance score (0-1) based on keyword overlap.
 *
 * In production, this would be replaced with vector embeddings +
 * cosine similarity. The interface remains the same.
 */
function calculateRelevance(query: string, text: string): number {
  const queryWords = query.split(/\s+/).filter((w) => w.length > 2);
  if (queryWords.length === 0) return 0;

  let matches = 0;
  for (const word of queryWords) {
    if (text.includes(word)) matches++;
  }

  return matches / queryWords.length;
}
