"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from 'react-i18next';

function renderTree(node, level = 0) {
  if (!node) return null;
  const colors = [
    '#2563eb', // أزرق للسنة
    '#059669', // أخضر للمعايير
    '#f59e42', // برتقالي للمؤشرات
    '#eab308', // أصفر للعناصر
    '#d946ef', // بنفسجي للمرفقات
    '#6366f1', // أزرق فاتح للكورسات
    '#f43f5e', // أحمر لأي مستوى إضافي
  ];
  const icons = [
    '📅', // سنة
    '📏', // معيار
    '📍', // مؤشر
    '🔸', // عنصر
    '📎', // مرفق
    '📚', // كورس
    '🔖', // إضافي
  ];
  const color = colors[level] || colors[colors.length - 1];
  const icon = icons[level] || icons[icons.length - 1];

  if (Array.isArray(node)) {
    return (
      <ul style={{ listStyle: 'none', paddingLeft: 18 }}>
        {node.map((child, idx) => (
          <li key={idx}>{renderTree(child, level)}</li>
        ))}
      </ul>
    );
  }
  if (typeof node === 'object') {
    if (node.title) {
      return (
        <details open style={{ marginBottom: 6 }}>
          <summary style={{ color, fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-color, ' + color + ')' }} className="dark:text-gray-300">
            <span>{icon}</span> {node.title}
          </summary>
          <div style={{ borderLeft: `3px solid ${color}33`, marginLeft: 12, paddingLeft: 12 }}>
            {node.pointers && renderTree(node.pointers, level + 1)}
            {node.elements && renderTree(node.elements, level + 1)}
            {node.attachments && renderTree(node.attachments, level + 1)}
            {node.course_files && renderTree(node.course_files, level + 1)}
          </div>
        </details>
      );
    }
    if (node.name) {
      return (
        <details open style={{ marginBottom: 6 }}>
          <summary style={{ color, fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-color, ' + color + ')' }} className="dark:text-gray-300">
            <span>{icon}</span> {node.name}
          </summary>
          <div style={{ borderLeft: `3px solid ${color}33`, marginLeft: 12, paddingLeft: 12 }}>
            {node.children && renderTree(node.children, level + 1)}
          </div>
        </details>
      );
    }
    // fallback for other objects
    return (
      <ul style={{ listStyle: 'none', paddingLeft: 18 }}>
        {Object.entries(node).map(([key, value]) => (
          <li key={key}><strong style={{ color: 'var(--text-color, ' + color + ')' }} className="dark:text-gray-300">{key}:</strong> {typeof value === 'object' ? renderTree(value, level + 1) : <span className="dark:text-gray-400">{String(value)}</span>}</li>
        ))}
      </ul>
    );
  }
  return <span style={{ color: 'var(--text-color, ' + color + ')' }} className="dark:text-gray-300">{icon} {String(node)}</span>;
}

// أضف بعض CSS لتحسين شكل الشجرة
const treeStyles = `
  .tree-container summary::-webkit-details-marker {
    display: none;
  }
  .tree-container details[open] > summary {
    background: #f3f4f6;
    border-radius: 6px;
    padding: 4px 8px;
    transition: background 0.2s;
    /* Dark mode styles */
    .dark & {
      background: #374151; /* gray-700 */
      color: #d1d5db; /* gray-300 */
    }
  }
  .tree-container details > summary:hover {
    background: #e0e7ef;
    /* Dark mode styles */
    .dark & {
      background: #4b5563; /* gray-600 */
    }
  }
`;

export default function StructurePage() {
  const searchParams = useSearchParams();
  const yearId = searchParams.get("year");
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!yearId) return;
    setLoading(true);

    // جلب التوكن من localStorage
    let token = null;
    if (typeof window !== "undefined") {
      const tokens = localStorage.getItem('tokens');
      if (tokens) {
        try {
          token = JSON.parse(tokens).access;
        } catch {}
      }
    }

    fetch(`http://127.0.0.1:8000/api/academic-years/${yearId}/structure/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch structure');
        return res.json();
      })
      .then((data) => {
        setStructure(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [yearId]);

  if (!yearId) return <div className="p-4 text-red-500">Please select an academic year.</div>;
  if (loading) return <div className="p-4">{t('Loading structure')}</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!structure) return <div className="p-4 text-red-500">No structure data found.</div>;

  return (
    <div className="p-6 dark:bg-gray-900 dark:text-gray-100 rounded-lg">
      <style>{treeStyles}</style>
      <h1 className="text-2xl font-bold mb-4 dark:text-gray-100">{t('Academic Year Structure')}</h1>
      <div className="bg-white rounded shadow p-4 tree-container">
        {renderTree({
          name: `${t('Academic Year')}: ${structure.academic_year.start_date} - ${structure.academic_year.end_date}`,
          children: [
            { name: t('Standards'), children: structure.standards },
            { name: t('Courses'), children: structure.courses },
          ],
        })}
      </div>
    </div>
  );
} 