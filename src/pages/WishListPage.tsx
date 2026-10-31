import { useEffect, useMemo, useState } from 'react';
import PageTitle from '../components/PageTitle';
import PageIllustration from '../components/PageIllustration';
import { apiCreateWish, apiDeleteWish, apiGetWishes, apiUpdateWish } from '../api';

interface WishItem {
  id: string;
  title: string;
  progress: number;
  category?: string;
  createdAt?: number;
  updatedAt?: number;
}

interface WishCategory {
  name: string;
  emoji: string;
}

const wishCategories: Record<string, WishCategory> = {
  career: { name: 'Career', emoji: '💼' },
  health: { name: 'Health', emoji: '🏃' },
  education: { name: 'Education', emoji: '📚' },
  travel: { name: 'Travel', emoji: '✈️' },
  relationships: { name: 'Relationships', emoji: '❤️' },
  creativity: { name: 'Creativity', emoji: '🎨' },
  finance: { name: 'Finance', emoji: '💰' },
  personal: { name: 'Personal', emoji: '⭐' },
};

const categoryKeys = Object.keys(wishCategories);
type CategoryKey = keyof typeof wishCategories;

interface WishListPageProps {
  token: string;
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getProgressMilestones(progress: number) {
  if (progress === 0) return 'Just started';
  if (progress < 25) return 'Getting started';
  if (progress < 50) return 'Halfway there';
  if (progress < 75) return 'Almost there';
  if (progress < 100) return 'Almost done';
  return 'Completed ✨';
}

function getProgressColor(progress: number) {
  if (progress < 25) return '#ef5350';
  if (progress < 50) return '#ff9800';
  if (progress < 75) return '#ffc107';
  if (progress < 100) return '#66bb6a';
  return '#4caf50';
}

export default function WishListPage({ token }: WishListPageProps) {
  const [wishTitle, setWishTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('personal');
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [timestamps, setTimestamps] = useState<Record<string, { createdAt: number; updatedAt: number }>>({});
  const [celebration, setCelebration] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<CategoryKey | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'name'>('recent');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await apiGetWishes(token);
        const loadedWishes = data.map((item: any) => ({
          id: item._id,
          title: item.title,
          progress: item.progress,
          category: item.category || 'personal',
        }));
        setWishes(loadedWishes);

        const savedTimestamps: Record<string, { createdAt: number; updatedAt: number }> = {};
        loadedWishes.forEach((wish: WishItem, index: number) => {
          savedTimestamps[wish.id] = {
            createdAt: Date.now() - index * 86400000,
            updatedAt: Date.now() - index * 3600000,
          };
        });
        setTimestamps(savedTimestamps);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(() => setCelebration(null), 4000);
    return () => window.clearTimeout(timer);
  }, [celebration]);

  const totalCount = wishes.length;
  const completedCount = useMemo(() => wishes.filter((wish) => wish.progress >= 100).length, [wishes]);
  const inProgressCount = useMemo(() => wishes.filter((wish) => wish.progress > 0 && wish.progress < 100).length, [wishes]);
  const averageProgress = useMemo(() => {
    if (!wishes.length) return 0;
    return Math.round(wishes.reduce((sum, item) => sum + item.progress, 0) / wishes.length);
  }, [wishes]);

  const filteredWishes = useMemo(() => {
    let result = wishes;
    if (filterCategory !== 'all') {
      result = result.filter((wish) => wish.category === filterCategory);
    }
    if (sortBy === 'progress') {
      result = result.sort((a, b) => b.progress - a.progress);
    } else if (sortBy === 'name') {
      result = result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result = result.sort((a, b) => (timestamps[b.id]?.createdAt || 0) - (timestamps[a.id]?.createdAt || 0));
    }
    return result;
  }, [wishes, filterCategory, sortBy, timestamps]);

  async function addWish() {
    if (!wishTitle.trim()) return;
    try {
      const newWish = await apiCreateWish(token, wishTitle.trim(), 0);
      const wishItem: WishItem = {
        id: newWish._id,
        title: newWish.title,
        progress: newWish.progress,
        category: selectedCategory,
      };
      setWishes((prev) => [...prev, wishItem]);
      setTimestamps((prev) => ({
        ...prev,
        [newWish._id]: { createdAt: Date.now(), updatedAt: Date.now() },
      }));
      setWishTitle('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function updateProgress(id: string, value: number) {
    const target = wishes.find((wish) => wish.id === id);
    if (!target) return;

    try {
      const updated = await apiUpdateWish(token, id, { progress: value });
      setWishes((prev) => prev.map((wish) => (wish.id === id ? { ...wish, progress: updated.progress } : wish)));
      setTimestamps((prev) => ({
        ...prev,
        [id]: { ...prev[id], updatedAt: Date.now() },
      }));
      if (value >= 100 && target.progress < 100) {
        setCelebration(`🎊 Amazing! You completed "${target.title}". Keep shining!`);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function removeWish(id: string) {
    try {
      await apiDeleteWish(token, id);
      setWishes((prev) => prev.filter((wish) => wish.id !== id));
      setTimestamps((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function duplicateWish(wish: WishItem) {
    setWishTitle(`${wish.title} (Copy)`);
    setSelectedCategory(wish.category as CategoryKey || 'personal');
  }

  return (
    <section className="page-card wishlist-page">
      <div className="page-header">
        <div>
          <PageTitle topic="goals"><h2>Wish List</h2></PageTitle>
          <p>Track your goals, celebrate progress, and complete every dream step by step.</p>
        </div>
        <PageIllustration topic="goals" />
      </div>

      {celebration && <div className="success-banner">🎉 {celebration}</div>}

      <div className="stats-row">
        <div className="stat-card">
          <span>Total Wishes</span>
          <strong>{totalCount}</strong>
        </div>
        <div className="stat-card">
          <span>In Progress</span>
          <strong>{inProgressCount}</strong>
        </div>
        <div className="stat-card">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>
        <div className="stat-card">
          <span>Avg Progress</span>
          <strong>{averageProgress}%</strong>
        </div>
      </div>

      <div className="wish-form-section">
        <div className="form-header">
          <h3>➕ Add New Wish</h3>
        </div>
        <div className="wish-input-row">
          <input
            value={wishTitle}
            onChange={(event) => setWishTitle(event.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addWish()}
            placeholder="What's your dream? e.g., Learn Spanish, Run a marathon..."
            className="wish-input"
          />
          <div className="category-buttons">
            {categoryKeys.map((key) => (
              <button
                key={key}
                className={`category-btn ${selectedCategory === key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(key)}
                title={wishCategories[key].name}
              >
                {wishCategories[key].emoji}
              </button>
            ))}
          </div>
          <button onClick={addWish} className="add-wish-btn">
            Add Wish
          </button>
        </div>
      </div>

      <div className="controls-section">
        <div className="filter-group">
          <label>Filter by:</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as any)}>
            <option value="all">All Categories</option>
            {categoryKeys.map((key) => (
              <option key={key} value={key}>
                {wishCategories[key].emoji} {wishCategories[key].name}
              </option>
            ))}
          </select>
        </div>

        <div className="sort-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="recent">Recently Added</option>
            <option value="progress">Highest Progress</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="wish-list">
        {loading && <p className="loading-state">🔄 Loading your wishes...</p>}
        {error && <p className="error-state">❌ {error}</p>}
        {!loading && !wishes.length && (
          <p className="empty-state">🌟 No wishes yet. Add one to begin your journey toward your dreams!</p>
        )}
        {!loading && wishes.length > 0 && filteredWishes.length === 0 && (
          <p className="empty-state">No wishes found in this category. Try a different filter!</p>
        )}
        {filteredWishes.map((wish) => (
          <article key={wish.id} className="wish-card">
            <div className="wish-header">
              <div className="wish-title-group">
                <span className="wish-emoji">{wishCategories[(wish.category as CategoryKey) || 'personal']?.emoji}</span>
                <h3 className="wish-title">{wish.title}</h3>
                {wish.progress >= 100 && <span className="completion-badge">✓ Done</span>}
              </div>
              <button
                className="action-btn delete-btn"
                onClick={() => removeWish(wish.id)}
                title="Delete wish"
              >
                ✕
              </button>
            </div>

            <div className="progress-container">
              <div className="progress-info">
                <span className="milestone">{getProgressMilestones(wish.progress)}</span>
                <span className="percentage">{wish.progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={wish.progress}
                onChange={(event) => updateProgress(wish.id, Number(event.target.value))}
                className="progress-slider"
                style={
                  {
                    '--progress-color': getProgressColor(wish.progress),
                  } as any
                }
              />
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${wish.progress}%`,
                    backgroundColor: getProgressColor(wish.progress),
                  }}
                />
              </div>
            </div>

            <div className="wish-metadata">
              <div className="meta-item">
                <span className="meta-label">Category:</span>
                <span className="meta-value">{wishCategories[(wish.category as CategoryKey) || 'personal']?.name}</span>
              </div>
              {timestamps[wish.id] && (
                <>
                  <div className="meta-item">
                    <span className="meta-label">Created:</span>
                    <span className="meta-value">{formatTime(timestamps[wish.id].createdAt)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Updated:</span>
                    <span className="meta-value">{formatTime(timestamps[wish.id].updatedAt)}</span>
                  </div>
                </>
              )}
            </div>

            {wish.progress < 100 && (
              <div className="wish-actions">
                <button
                  className="action-btn duplicate-btn"
                  onClick={() => duplicateWish(wish)}
                  title="Duplicate this wish"
                >
                  📋 Duplicate
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
