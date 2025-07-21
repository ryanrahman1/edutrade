window.addEventListener('load', () => {
  if (window.location.hash) {
    const key = window.location.hash.substring(1);
    const [type, payload] = key.split(':');
    if (type === 'stock' && payload) {
      openModal(type, payload);
    }
  }
});

window.addEventListener('hashchange', () => {
  if (window.location.hash) {
    const key = window.location.hash.substring(1);
    const [type, payload] = key.split(':');
    if (type === 'stock' && payload) {
      openModal(type, payload);
    }
  } else {
    closeModal();
  }
});


async function openModal(type, payload) {
  const overlay = getOrCreateOverlay();
  const modalBox = document.getElementById('modal-content');

  modalBox.classList.remove('modal-content', 'modal-search');

  if (type === 'search') {
    modalBox.classList.add('modal-search');
  } else {
    modalBox.classList.add('modal-content');
  }

  const contentEl = await renderModalContent(type, payload);
  modalBox.innerHTML = '';
  modalBox.appendChild(contentEl);

  overlay.classList.remove('hidden');
  overlay.classList.add('show');

  document.addEventListener('keydown', escListener);
  document.addEventListener('click', clickListener);

  document.body.style.overflow = 'hidden'; // lock background scroll

  // Update URL hash based on type
  if (type === 'stock' && payload) {
    const encodedPayload = encodeURIComponent(payload);
    if (window.location.hash !== `#stock:${encodedPayload}`) {
      history.pushState(null, '', `#stock:${encodedPayload}`);
    }
  } else {
    if (window.location.hash !== `#${type}`) {
      history.pushState(null, '', `#${type}`);
    }
  }
}



function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('show');
  overlay.classList.add('hidden');

  document.removeEventListener('keydown', escListener);

  document.body.style.overflow = ''; // unlock scroll

  if (window.location.hash) {
    history.pushState("", document.title, window.location.pathname + window.location.search);
  }
}

function escListener(e) {
  if (e.key === 'Escape') closeModal();
}
function clickListener(e) {
  if (e.target.id === 'modal-overlay') {
    closeModal();
  }
}

function getOrCreateOverlay() {
  let overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay hidden';
    overlay.innerHTML = `<div id="modal-content" class="modal-content"></div>`; // only once here
    document.body.appendChild(overlay);
  }
  return overlay;
}

async function renderModalContent(type, payload) {
  const wrapper = document.createElement('div');

  if (type == "stock") {
    // Fetch real stock data
    let data;
    try {
      const res = await fetch(`http://localhost:3000/api/quote/${encodeURIComponent(payload)}`);
      if (!res.ok) throw new Error('Failed to fetch stock data');
      data = await res.json();
    } catch (err) {
      wrapper.innerHTML = `<h2>Error loading data for ${payload}</h2><p>${err.message}</p>`;
      return wrapper;
    }

    const change = data.regularMarketPrice - data.regularMarketPreviousClose;
    const changePercent = ((change / data.regularMarketPreviousClose) * 100).toFixed(2);
    // Check if it's a weekday and between 9:30am–4:00pm ET
    const now = new Date();

    // Convert to EST/EDT (New York time)
    const nyTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short'
    }).formatToParts(now).reduce((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value;
      return acc;
    }, {});

    const hour = parseInt(nyTime.hour);
    const minute = parseInt(nyTime.minute);
    const day = nyTime.weekday;

    // Market hours: 9:30–16:00 ET, Mon–Fri
    const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day);
    const isAfter930 = hour > 9 || (hour === 9 && minute >= 30);
    const isBefore1600 = hour < 16;
    const isMarketOpen = isWeekday && isAfter930 && isBefore1600;

    wrapper.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2>${data.longName || payload} Stock Info</h2>
        <button onclick="closeModal()" style="font-size: 1.5rem; background: none; border: none; cursor: pointer;">&times;</button>
      </div>
      <div style="margin-bottom: 1rem;">
        <h3 style="font-size: 2.5rem; margin: 0;">
          $${data.regularMarketPrice.toFixed(2)} 
          <span style="color: ${change >= 0 ? '#4ade80' : '#f87171'}; font-weight: 600;">
            (${change >= 0 ? '+' : ''}${change.toFixed(2)} / ${changePercent}%)
          </span>
        </h3>
        <p style="color: var(--subtle-text); margin-top: 0.25rem;">${data.longName}</p>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; color: var(--text);">
        <div><strong>Exchange:</strong> ${data.exchange || 'N/A'}</div>
        <div><strong>Market Cap:</strong> $${(data.marketCap / 1e9).toFixed(2)}B</div>
        <div><strong>Volume:</strong> ${data.volume.toLocaleString()}</div>
      </div>
      <div style="height: 200px; background: var(--surface-hover); border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; color: var(--subtle-text); font-style: italic; margin-bottom: 2rem;">
        Graph is coming soon
      </div>
      <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
        <button 
          id="buy-btn" 
          class="${!isMarketOpen ? 'disabled-btn' : ''}" 
          ${!isMarketOpen ? 'disabled' : ''} 
          style="flex: 1; padding: 0.75rem; background-color: #4ade80; border: none; border-radius: 0.5rem; cursor: pointer;"
        >
          Buy
        </button>
        <button 
          id="sell-btn" 
          class="${!isMarketOpen ? 'disabled-btn' : ''}" 
          ${!isMarketOpen ? 'disabled' : ''} 
          style="flex: 1; padding: 0.75rem; background-color: #f87171; border: none; border-radius: 0.5rem; cursor: pointer;"
        >
          Sell
        </button>
      </div>
      <div id="trade-form-container"></div>
    `;

    if (!isMarketOpen) {
      const note = document.createElement('p');
      note.textContent = 'Market is currently closed.';
      note.style.color = 'var(--subtle-text)';
      note.style.fontStyle = 'italic';
      note.style.fontSize = '0.9rem';
      note.style.marginBottom = '1rem';
      wrapper.appendChild(note);
    }

    // Add trade form openers
    wrapper.querySelector('#buy-btn').addEventListener('click', () => openTradeForm(payload, 'buy'));
    wrapper.querySelector('#sell-btn').addEventListener('click', () => openTradeForm(payload, 'sell'));

    return wrapper;
  } else if (type === 'search') {
    wrapper.innerHTML = `
      <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; box-sizing: border-box; height: 100%">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2>Search Stocks</h2>
          <button onclick="closeModal()" style="font-size: 1.5rem; background: none; border: none; cursor: pointer;">&times;</button>
        </div>
        <input type="text" id="stock-search-input" placeholder="Type a company name or symbol..." 
          style="width: 100%; padding: 0.75rem 1rem; font-size: 1.1rem; border-radius: 0.5rem; 
          border: 1px solid var(--border); margin-bottom: 1rem; background: var(--bg); color: var(--text); box-sizing: border-box;" />
        
        <div id="search-results"
          style="
            flex: 1;
            overflow-y: auto;
            padding-right: 0.25rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            min-height: 0;
            box-sizing: border-box;
          ">
        </div>
      </div>
    `;

    // Search logic
    const input = wrapper.querySelector('#stock-search-input');
    const resultsEl = wrapper.querySelector('#search-results');

    input.addEventListener('input', async () => {
      const query = input.value.trim();
      if (query.length < 2) {
        resultsEl.innerHTML = '';
        return;
      }

      try {
        const res = await fetch(`http://localhost:3000/api/market/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Search failed');
        const results = await res.json();

        resultsEl.innerHTML = results.length > 0
          ? results.map(stock => `
              <div class="search-result-item" onclick="openModal('stock:${stock.Symbol}')">
                <strong>${stock.Symbol}</strong> - ${stock.Security}
              </div>
            `).join('')
          : `<p style="color: var(--subtle-text);">No results found.</p>`;
      } catch (err) {
        console.error(err);
        resultsEl.innerHTML = `<p style="color: var(--accent);">Error searching stocks.</p>`;
      }
    });

    return wrapper;
  } else if (type === 'announcement') {
    const date = new Date(payload.created_at);
    const formattedDate = date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    wrapper.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2>${payload.title}</h2>
        <button onclick="closeModal()" style="font-size: 1.5rem; background: none; border: none; cursor: pointer;">&times;</button>
      </div>
      <p style="color: var(--subtle-text); margin-top: -0.5rem; margin-bottom: 1.5rem;">
        Posted by <strong>${payload.username}</strong> • ${formattedDate}
      </p>
      <div style="white-space: pre-wrap; line-height: 1.6; color: var(--text); font-size: 1rem;">
        ${payload.content}
      </div>
    `;


    return wrapper;
  }
  


  wrapper.innerHTML = `<h2>Unknown modal type: ${type}</h2>`;
  return wrapper;
}

function openTradeForm(symbol, transactionType) {
  const container = document.getElementById('trade-form-container');
  if (!container) return;

  container.innerHTML = `
    <form id="trade-form" style="display:flex; gap: 1rem; align-items:center;">
      <input 
        type="number" 
        name="shares" 
        min="1" 
        placeholder="How many shares?" 
        required 
        style="flex: 1; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid var(--border); font-size: 1rem;"/>
      <button type="submit" style="padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; background: ${transactionType === 'buy' ? '#4ade80' : '#f87171'}; border: none; color: black;">
        ${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}
      </button>
    </form>
  `;

  container.querySelector('#trade-form').addEventListener('submit', async e => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    const email = user.email;
    if (!email) {
      alert('You must be logged in to trade.');
      return;
    }
    const shares = e.target.shares.value;
    if (shares <= 0) {
      alert('Enter a valid number of shares.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, symbol, shares, transactionType })
      });
      if (!res.ok) throw new Error('Trade failed');
      alert(`${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} order for ${shares} shares of ${symbol} placed successfully!`);
      closeModal();
    } catch (err) {
      alert('Trade failed, check console.');
      console.error(err);
    }
  });
}
