document.addEventListener('DOMContentLoaded', async () => {

    const stocksList = document.querySelector('.stocks-list');

    //get email from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    const loggedInUser = {
        email: user.email,
        username: user.username,
    };

    // Array of top 10 stock symbols — you can customize this
    const topStocks = ['NVDA', 'MSFT', 'AAPL', 'GOOG', 'AMZN', 'META', 'TSLA'];
    const tickerSymbols = ['AAPL', 'TSLA', 'NVDA', 'AMZN', 'META', 'GOOGL', 'PLTR', 'NFLX', 'MSFT', 'BABA'];
    const tickerContainer = document.getElementById('live-stock-ticker');

    // Clear old content
    stocksList.innerHTML = '';

    // Fetch quote for each symbol and render
    async function fetchAndRenderStocks(symbols) {
        try {
            const fetches = symbols.map(symbol =>
            fetch(`http://localhost:3000/api/quote/${encodeURIComponent(symbol)}`)
                .then(res => {
                if (!res.ok) throw new Error(`Failed to fetch ${symbol}`);
                return res.json();
                })
            );

            const stocksData = await Promise.all(fetches);

            stocksData.forEach(data => {
            const div = document.createElement('div');
            div.className = 'stock-item';

            const changePercent =
                ((data.regularMarketPrice - data.regularMarketPreviousClose) /
                data.regularMarketPreviousClose) *
                100;

            div.innerHTML = `
                <h4>${data.symbol}</h4>
                <p>Price: $${data.regularMarketPrice.toFixed(2)} 
                (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)</p>
            `;

            // 🔥 Add click handler to open modal
            div.addEventListener('click', () => openModal('stock', data.symbol));

            stocksList.appendChild(div);
            });
        } catch (error) {
            console.error('Error loading stock data:', error);
            stocksList.innerHTML = `<p style="color: var(--accent);">Failed to load stock data.</p>`;
        }
    }


    async function fetchQuote(symbol) {
        try {
            const res = await fetch(`http://localhost:3000/api/quote/${encodeURIComponent(symbol)}`);
            if (!res.ok) throw new Error('API error');
            return await res.json();
        } catch (error) {
            return null;
        }
    }

    async function fetchAndRenderTicker() {
        const results = await Promise.all(tickerSymbols.map(fetchQuote));
        
        const tickerHTML = results
            .map((data, i) => {
                if (!data) return '';
                const percent = parseFloat(data.regularMarketChangePercent).toFixed(2);
                const symbol = data.symbol || tickerSymbols[i];
                const arrow = percent >= 0 ? '↑' : '↓';
                const color = percent >= 0 ? '#4ade80' : '#f87171';

                return `<span style="color: ${color}; font-weight: 600;">${symbol} ${arrow} ${Math.abs(percent)}%</span>`;
            })
            .filter(Boolean)
            .join(' <span style="color: var(--subtle-text);">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>');
        tickerContainer.innerHTML = `${tickerHTML}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${tickerHTML}`;
    }

    fetchAndRenderTicker();

    async function getDashboardData() {
        try {
            const res = await fetch(`http://localhost:3000/api/dashboard?email=${encodeURIComponent(loggedInUser.email)}`);
            if (!res.ok) throw new Error('Failed to fetch dashboard data');
            const data = await res.json();
            // Update the dashboard with the fetched data
            document.getElementById('port-val').textContent = `$${data.portfolio.total_value.toFixed(2)}`;
            document.getElementById('port-cash').textContent = `Cash: $${data.portfolio.cash_balance.toFixed(2)}`;

            
            const stocksList = document.querySelector('.userStock-stocks-list');

            for (const stock of data.holdings) {
                const price = stock.current_price;

                const div = document.createElement('div');
                div.className = 'userStock-stock-item';
                div.innerHTML = `
                    <div class="userStock-stock-left">  
                        <div class="userStock-stock-symbol">${stock.symbol}</div>
                    </div>
                    <div class="userStock-stock-right">
                        <div class="userStock-stock-price">${price !== null ? `$${price.toFixed(2)}` : 'N/A'}</div>                    
                        <div class="userStock-shares-owned">${stock.shares} shares</div>
                    </div>
                `;
                stocksList.appendChild(div);
            }



        }
        catch (error) {
            console.error('Error fetching dashboard data:', error);
            document.getElementById('port-val').textContent = 'Error loading data';
        }
    }

    async function updateLeaderboard() {
        const leaderboard = document.getElementById('leaderboard');
        try {
            const res = await fetch('http://localhost:3000/api/top-users');
            if (!res.ok) throw new Error('Failed to fetch leaderboard data');
            const data = await res.json();
            leaderboard.innerHTML;
            data.forEach(user => {
                const p = document.createElement('p');
                p.textContent = `${user.rank}: ${user.username} - $${user.total_value.toFixed(2)}`;
                leaderboard.appendChild(p);
            });
        } catch (error) {
            leaderboard.innerHTML = '<p style="color: var(--accent);">Failed to load leaderboard.</p>';
        }
    }

    updateLeaderboard();

    // Call it once to load the top stocks
    fetchAndRenderStocks(topStocks);
    getDashboardData();

});