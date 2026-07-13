import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, MapPin, Calendar, Phone, X, MessageSquare, Compass, Image as ImageIcon,
  LayoutGrid, List, Store, Package, Clock, Hash, User, ChevronLeft, ChevronRight,
  SlidersHorizontal, Inbox, ExternalLink, CreditCard
} from 'lucide-react';

const PAGE_SIZE = 24;

// The mobile app writes the visit date to `date`; some records use `visitDate`.
// Fall back to the server timestamp so a record never renders as "No Date".
const visitDateOf = (item) =>
  item.visitDate || item.date || (item.createdAt ? item.createdAt.slice(0, 10) : '');

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const nameOf = (item) => item.contactPerson || item.name || 'Unnamed Mechanic';
const initialOf = (item) => (nameOf(item).trim()[0] || '?').toUpperCase();
const productsOf = (item) => {
  const list = Array.isArray(item.products) ? item.products.filter(Boolean) : [];
  if (list.length) return list;
  return item.product ? [item.product] : [];
};

// Many stored photo URLs are dead. Degrade to the mechanic's initial rather than
// a remote placeholder, which would just be a second thing that can fail.
function Avatar({ item, imgClass, fallbackClass, onClick }) {
  const [broken, setBroken] = useState(false);
  const src = item.images?.[0];

  if (!src || broken) {
    return <div className={fallbackClass} onClick={onClick}>{initialOf(item)}</div>;
  }

  return (
    <img
      src={src}
      alt={nameOf(item)}
      className={imgClass}
      loading="lazy"
      onClick={onClick}
      onError={() => setBroken(true)}
    />
  );
}

function Field({ label, value, icon, href, mono }) {
  const empty = value === undefined || value === null || String(value).trim() === '';
  return (
    <div className="field-cell">
      <span className="field-label">{icon}{label}</span>
      <div
        className={`field-value ${empty ? 'empty' : ''} ${mono ? 'td-mono' : ''}`}
        dir={mono ? 'ltr' : 'auto'}
      >
        {empty ? 'Not recorded' : href ? <a href={href}>{value}</a> : value}
      </div>
    </div>
  );
}

function SamplingList({ token, showToast }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [cities, setCities] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState('grid');

  const [selected, setSelected] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  // Debounce typing so a 1,300-record collection isn't queried on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    fetch('/api/mechanics/cities', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then(setCities)
      .catch(() => setCities([]));
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sort
      });
      if (search) params.set('search', search);
      if (city) params.set('city', city);

      const res = await fetch(`/api/mechanics?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch mechanics data');

      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error(err);
      showToast('Failed to load mechanics data', 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, search, city, sort, showToast]);

  useEffect(() => { load(); }, [load]);

  // Close the modal / lightbox on Escape.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (lightbox) setLightbox(null);
      else if (selected) setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, selected]);

  const clearFilters = () => {
    setSearchInput('');
    setCity('');
    setSort('newest');
    setPage(1);
  };

  const hasFilters = Boolean(search || city);
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  // Windowed page numbers: 1 … 4 5 [6] 7 8 … 58
  const pageNumbers = () => {
    const out = [];
    const push = (n) => out.push(n);
    const span = 1;
    const start = Math.max(2, page - span);
    const end = Math.min(pages - 1, page + span);

    push(1);
    if (start > 2) push('…');
    for (let i = start; i <= end; i++) push(i);
    if (end < pages - 1) push('…');
    if (pages > 1) push(pages);
    return out;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Toolbar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search />
          <input
            type="text"
            placeholder="Search name, shop, mobile, city, address, remarks…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            dir="auto"
          />
          {searchInput && (
            <button className="search-clear" onClick={() => setSearchInput('')} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <select
          className="filter-select"
          value={city}
          onChange={(e) => { setCity(e.target.value); setPage(1); }}
          aria-label="Filter by city"
        >
          <option value="">All cities ({cities.length})</option>
          {cities.map((c) => (
            <option key={c.city} value={c.city}>{c.city} ({c.count})</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          aria-label="Sort order"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="shop">Shop name (A–Z)</option>
          <option value="city">Group by city</option>
        </select>

        <div className="segmented">
          <button
            className={view === 'grid' ? 'active' : ''}
            onClick={() => setView('grid')}
            title="Card view"
            aria-label="Card view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={view === 'table' ? 'active' : ''}
            onClick={() => setView('table')}
            title="Table view"
            aria-label="Table view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Result count — the number the dashboard reports must match what's listed */}
      <div className="toolbar-meta">
        <div>
          {loading ? 'Loading…' : total === 0 ? 'No records' : (
            <>Showing <strong>{from.toLocaleString()}–{to.toLocaleString()}</strong> of <strong>{total.toLocaleString()}</strong> mechanics</>
          )}
        </div>

        {hasFilters && (
          <div className="chip-row">
            {search && (
              <span className="chip" dir="auto">
                “{search}”
                <button onClick={() => setSearchInput('')} aria-label="Clear search"><X size={12} /></button>
              </span>
            )}
            {city && (
              <span className="chip" dir="auto">
                <MapPin size={11} /> {city}
                <button onClick={() => { setCity(''); setPage(1); }} aria-label="Clear city"><X size={12} /></button>
              </span>
            )}
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
              <SlidersHorizontal size={12} /> Reset
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="mechanics-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton" style={{ width: 74, height: 74, borderRadius: '50%' }} />
              <div className="skeleton" style={{ width: '65%', height: 14 }} />
              <div className="skeleton" style={{ width: '45%', height: 11 }} />
              <div className="skeleton" style={{ width: '80%', height: 30, marginTop: 8 }} />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Inbox size={24} /></div>
          <h4>{hasFilters ? 'No matching mechanics' : 'No mechanics registered yet'}</h4>
          <p>
            {hasFilters
              ? 'No record matches the current search and filters. Try broadening them.'
              : 'Records submitted from the field app will appear here.'}
          </p>
          {hasFilters && (
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear filters</button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="mechanics-grid">
          {items.map((item) => {
            const products = productsOf(item);
            return (
              <div key={item._id} className="mechanic-grid-card" onClick={() => setSelected(item)}>
                <div className="mechanic-card-flags">
                  <span className={`flag-dot ${item.images?.length ? 'on' : ''}`} title={`${item.images?.length || 0} photo(s)`}>
                    <ImageIcon size={11} />
                  </span>
                  <span className={`flag-dot ${item.comment ? 'on' : ''}`} title={item.comment ? 'Has remarks' : 'No remarks'}>
                    <MessageSquare size={11} />
                  </span>
                </div>

                <Avatar
                  item={item}
                  imgClass="mechanic-photo-circle"
                  fallbackClass="mechanic-avatar-fallback"
                />

                <h3 dir="auto" title={nameOf(item)}>{nameOf(item)}</h3>
                <div className="mechanic-shop" dir="auto" title={item.shopName || ''}>
                  {item.shopName?.trim() || 'No shop name'}
                </div>
                <div className="mechanic-city-tag" dir="auto">{item.city?.trim() || 'No city'}</div>

                {products.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }} dir="auto">
                    {products.length === 1 ? products[0] : `${products.length} products`}
                  </div>
                )}

                <div className="mechanic-meta-row">
                  <span dir="ltr">{item.mobile || '—'}</span>
                  <span>{formatDate(visitDateOf(item)) || '—'}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 52 }}></th>
                  <th>Mechanic</th>
                  <th>Shop</th>
                  <th>Mobile</th>
                  <th>City</th>
                  <th>Address</th>
                  <th>Visit date</th>
                  <th style={{ width: 70 }}>Media</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} onClick={() => setSelected(item)}>
                    <td>
                      <Avatar item={item} imgClass="td-avatar" fallbackClass="td-avatar td-avatar-fallback" />
                    </td>
                    <td className="td-primary"><span className="td-truncate" dir="auto">{nameOf(item)}</span></td>
                    <td><span className="td-truncate" dir="auto">{item.shopName?.trim() || '—'}</span></td>
                    <td className="td-mono" dir="ltr">{item.mobile || '—'}</td>
                    <td dir="auto">{item.city?.trim() || '—'}</td>
                    <td className="td-muted"><span className="td-truncate" dir="auto">{item.address?.trim() || '—'}</span></td>
                    <td className="td-muted td-mono">{formatDate(visitDateOf(item)) || '—'}</td>
                    <td className="td-muted">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <ImageIcon size={13} /> {item.images?.length || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="pagination">
          <span className="muted">Page {page} of {pages.toLocaleString()}</span>
          <div className="pager">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page">
              <ChevronLeft size={15} />
            </button>
            {pageNumbers().map((n, i) =>
              n === '…' ? (
                <button key={`e${i}`} className="ellipsis" disabled>…</button>
              ) : (
                <button
                  key={n}
                  className={n === page ? 'active' : ''}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              )
            )}
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} aria-label="Next page">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Detail — every stored field, nothing invented */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelected(null)} aria-label="Close">
              <X size={15} />
            </button>

            <div className="detail-hero">
              <Avatar
                item={selected}
                imgClass="detail-hero-photo"
                fallbackClass="detail-hero-fallback"
                onClick={() => selected.images?.[0] && setLightbox(selected.images[0])}
              />

              <div className="detail-hero-info">
                <div className="detail-hero-org">AAM Power · Registered Mechanic</div>
                <div className="detail-hero-name" dir="auto">{nameOf(selected)}</div>
                <div className="detail-hero-shop" dir="auto">
                  {selected.shopName?.trim() || 'No shop name recorded'}
                </div>
                <div className="detail-hero-badges">
                  {selected.city?.trim() && (
                    <span className="badge badge-primary" dir="auto"><MapPin size={11} /> {selected.city.trim()}</span>
                  )}
                  {visitDateOf(selected) && (
                    <span className="badge badge-neutral"><Calendar size={11} /> {formatDate(visitDateOf(selected))}</span>
                  )}
                  {selected.comment && <span className="badge badge-emerald"><MessageSquare size={11} /> Reviewed</span>}
                  {selected.images?.length > 0 && (
                    <span className="badge badge-amber"><ImageIcon size={11} /> {selected.images.length} photo{selected.images.length > 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="detail-body">
              <section>
                <div className="detail-section-title"><User size={12} /> Identity &amp; contact</div>
                <div className="field-grid">
                  <Field label="Name" icon={<User size={10} />} value={selected.contactPerson || selected.name} />
                  <Field label="Father's name" value={selected.fatherName} />
                  <Field
                    label="Mobile"
                    icon={<Phone size={10} />}
                    value={selected.mobile}
                    href={selected.mobile ? `tel:${selected.mobile}` : undefined}
                    mono
                  />
                  <Field label="CNIC" icon={<CreditCard size={10} />} value={selected.cnic} mono />
                  <Field label="Email" value={selected.email} href={selected.email ? `mailto:${selected.email}` : undefined} />
                  <Field label="Province" value={selected.state || selected.province} />
                </div>
              </section>

              <section>
                <div className="detail-section-title"><Store size={12} /> Shop &amp; location</div>
                <div className="field-grid">
                  <Field label="Shop name" icon={<Store size={10} />} value={selected.shopName} />
                  <Field label="City" icon={<MapPin size={10} />} value={selected.city?.trim()} />
                  <Field label="Address" value={selected.address} />
                  <Field label="Visit date" icon={<Calendar size={10} />} value={formatDate(visitDateOf(selected))} />
                </div>
              </section>

              {productsOf(selected).length > 0 && (
                <section>
                  <div className="detail-section-title"><Package size={12} /> Products logged</div>
                  <div className="chip-row">
                    {productsOf(selected).map((p, i) => (
                      <span key={i} className="chip" dir="auto" style={{ paddingRight: 10 }}>{p}</span>
                    ))}
                  </div>
                </section>
              )}

              {selected.comment && (
                <section>
                  <div className="detail-section-title"><MessageSquare size={12} /> Field remarks</div>
                  <blockquote className="quote-block" dir="auto">{selected.comment}</blockquote>
                </section>
              )}

              {selected.review && (
                <section>
                  <div className="detail-section-title"><MessageSquare size={12} /> Review</div>
                  <blockquote className="quote-block" dir="auto">{selected.review}</blockquote>
                </section>
              )}

              {selected.location && (selected.location.lat || selected.location.lon) && (
                <section>
                  <div className="detail-section-title"><MapPin size={12} /> Location</div>
                  <div style={{ marginTop: '10px', width: '100%' }}>
                    <iframe
                      title="Mechanic Location Map"
                      width="100%"
                      height="240"
                      style={{ border: 0, borderRadius: '14px', background: 'rgba(255,255,255,0.03)' }}
                      src={`https://maps.google.com/maps?q=${selected.location.lat},${selected.location.lon}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      allowFullScreen
                      loading="lazy"
                    ></iframe>
                  </div>
                  <div className="coord-row" style={{ marginTop: '12px' }}>
                    <span className="coord-val" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      GPS: {selected.location.lat?.toFixed(5)}, {selected.location.lon?.toFixed(5)}
                    </span>
                    <a
                      className="btn btn-secondary btn-sm"
                      href={`https://www.google.com/maps/search/?api=1&query=${selected.location.lat},${selected.location.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={12} /> Open in Maps
                    </a>
                  </div>
                </section>
              )}

              {selected.images?.length > 0 && (
                <section>
                  <div className="detail-section-title">
                    <ImageIcon size={12} /> Attached media ({selected.images.length})
                  </div>
                  <div className="photo-grid">
                    {selected.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Attachment ${i + 1}`}
                        className="photo-thumb"
                        loading="lazy"
                        onClick={() => setLightbox(img)}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <div className="detail-section-title"><Clock size={12} /> Record metadata</div>
                <div className="field-grid">
                  <Field label="Submitted" icon={<Clock size={10} />} value={formatDateTime(selected.createdAt)} mono />
                  <Field label="Last updated" value={formatDateTime(selected.updatedAt)} mono />
                  <Field label="Record ID" icon={<Hash size={10} />} value={selected._id} mono />
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Attachment full size" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

export default SamplingList;
