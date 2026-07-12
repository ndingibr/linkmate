import React from "react";

export default function Source({ query, setQuery, handleSearch, loading, error }) {
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
      
      <h2 style={{ color: 'white', fontSize: '32px', fontWeight: '700', marginBottom: '15px' }}>
        What Are You Looking For?
      </h2>
      <p style={{ color: 'white', fontSize: '18px', lineHeight: '1.5', marginBottom: '30px' }}>
        Spare parts, electronics, machinery, furniture — we’ll find it!
      </p>

      <form 
        onSubmit={handleSearch} 
        style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
      >
        <input
          type="text"
          placeholder="e.g. Engine for Ford Ranger"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: '1 1 60%',
            padding: '12px 20px',
            fontSize: '16px',
            borderRadius: '30px',
            border: '2px solid #f17c13',
            color: '#333',
            outline: 'none',
          }}
        />
        <button 
          className="btn-primary" 
          style={{
            backgroundColor: 'transparent',
            color: '#fff',
            border: '2px solid #fff',
            fontWeight: '600',
            padding: '12px 35px',
            fontSize: '16px',
            borderRadius: '30px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={e => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <p 
          style={{ 
            marginTop: '15px', 
            color: '#fff', 
            fontSize: '14px', 
            fontWeight: '500',
            lineHeight: '1.4'
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
