import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Clock } from 'lucide-react';
import { TEMPLATES, CATEGORY_LABELS, type TemplateItem, type TemplateCategory } from '../data/templates';

const STORAGE_FAVORITES = 'template-favorites';
const STORAGE_RECENT = 'template-recent';

function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getRecent(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_RECENT);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addRecent(id: string) {
  const recent = getRecent().filter((x) => x !== id);
  recent.unshift(id);
  localStorage.setItem(STORAGE_RECENT, JSON.stringify(recent.slice(0, 5)));
}

function toggleFavorite(id: string): string[] {
  const fav = getFavorites();
  const next = fav.includes(id) ? fav.filter((x) => x !== id) : [...fav, id];
  localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(next));
  return next;
}

export default function TemplatePanel() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('all');
  const [favorites, setFavorites] = useState<string[]>(getFavorites);

  const filtered = useMemo(() => {
    let list = TEMPLATES;
    if (category !== 'all') list = list.filter((t) => t.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    return list;
  }, [search, category]);

  const recentIds = getRecent();
  const recentTemplates = recentIds
    .map((id) => TEMPLATES.find((t) => t.id === id))
    .filter(Boolean) as TemplateItem[];

  const handleClick = (t: TemplateItem) => {
    addRecent(t.id);
    navigate(t.path);
  };

  const handleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(toggleFavorite(id));
  };

  const categories = (['all', 'productivity', 'ai', 'documents', 'automation'] as const).map((c) => ({
    id: c,
    label: CATEGORY_LABELS[c],
  }));

  return (
    <div className="space-y-10">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              category === c.id
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            <Star className="w-4 h-4 text-amber-500" />
            Favorites
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {TEMPLATES.filter((t) => favorites.includes(t.id)).map((t) => (
              <TemplateTile key={t.id} template={t} onClick={() => handleClick(t)} onFavorite={(e) => handleFavorite(e, t.id)} isFavorite />
            ))}
          </div>
        </section>
      )}

      {/* Recent */}
      {recentTemplates.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            <Clock className="w-4 h-4 text-slate-400" />
            Recently used
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recentTemplates.map((t) => (
              <TemplateTile
                key={t.id}
                template={t}
                onClick={() => handleClick(t)}
                onFavorite={(e) => handleFavorite(e, t.id)}
                isFavorite={favorites.includes(t.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Main grid */}
      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">Templates</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {filtered.map((t) => (
            <TemplateTile
              key={t.id}
              template={t}
              onClick={() => handleClick(t)}
              onFavorite={(e) => handleFavorite(e, t.id)}
              isFavorite={favorites.includes(t.id)}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-slate-500 text-center py-12">No templates match your search or category.</p>
        )}
      </section>
    </div>
  );
}

function TemplateTile({
  template,
  onClick,
  onFavorite,
  isFavorite,
}: {
  template: TemplateItem;
  onClick: () => void;
  onFavorite: (e: React.MouseEvent) => void;
  isFavorite: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl text-left hover:bg-slate-50 hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm group-hover:shadow-md transition-shadow"
        style={{ backgroundColor: template.color }}
      >
        {template.icon}
      </div>
      <span className="text-sm font-medium text-slate-800 flex-1 min-w-0">{template.name}</span>
      <button
        type="button"
        onClick={onFavorite}
        className="p-1.5 rounded-lg text-slate-300 hover:text-amber-500 hover:bg-amber-50 transition-colors shrink-0"
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
      </button>
    </button>
  );
}
