document.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('.stock-search-input');
    const resultsEl = document.querySelector('.search-results');

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
            resultsEl.innerHTML = ''; // clear previous results

            if (results.length > 0) {
                results.forEach(stock => {
                    const item = document.createElement('div');
                    item.className = 'search-result-item';
                    item.innerHTML = `<strong>${stock.Symbol}</strong> - ${stock.Security}`;

                    // attach listener here with correct stock context
                    item.addEventListener('click', () => {
                        openModal('stock', stock.Symbol); // capital S to match your data
                    });

                    resultsEl.appendChild(item);
                });
            } else {
                resultsEl.innerHTML = `<p style="color: var(--subtle-text);">No results found.</p>`;
            }

        } catch (err) {
            console.error(err);
            resultsEl.innerHTML = `<p style="color: var(--accent);">Error searching stocks.</p>`;
        }
    });
});
