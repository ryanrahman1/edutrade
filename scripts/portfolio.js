document.addEventListener('DOMContentLoaded', async () => {

    const user = JSON.parse(localStorage.getItem('user'));
    const email = user.email;

    const res = await fetch(`http://localhost:3000/api/portfolio?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('failed to get portfolio');
    const data = await res.json();

    document.querySelector('.portfolio-value').textContent = `$${data.portfolio.total_value.toFixed(2)}`;
    document.querySelector('.portfolio-cash').textContent = `Cash: $${data.portfolio.cash_balance.toFixed(2)}`;

    localStorage.setItem('portvalcache', data.portfolio.total_value.toFixed(2));


    const stockList = document.querySelector('.your-stock-list');


    for (const stock of data.holdings) {
        const price = stock.current_price;

        const div = document.createElement('div');
        div.className = 'stock-item';
        div.innerHTML = `
            <div class="stock-left">  
                <div class="mystock-symbol">${stock.symbol}</div>
                </div>
            <div class="stock-right">
                <div class="mystock-price">${price !== null ? `$${price.toFixed(2)}` : 'N/A'}</div>                    
                <div class="myshares-owned">${stock.shares} shares</div>
            </div>
        `;
        div.addEventListener('click', () => openModal('stock', stock.symbol));
        stockList.appendChild(div);
    }

    const topStocks = document.querySelector('.top-stock-list');

    // Sort and slice top 3 holdings
    const sortedHoldings = data.holdings.sort((a, b) =>
        (b.shares * b.current_price) - (a.shares * a.current_price)
    );
    const topThree = sortedHoldings.slice(0, 3);

    // Build symbols list
    const symbols = topThree.map(stock => stock.symbol).join(',');

    // Fetch all at once using /api/quotes
    const stocksres = await fetch(`http://localhost:3000/api/quotes?symbols=${symbols}`);
    const quotesData = await stocksres.json();

    for (const stock of topThree) {
        const quote = quotesData[stock.symbol];
        if (!quote) continue;

        const change = quote.regularMarketPrice - quote.regularMarketPreviousClose;
        const changePercent = ((change / quote.regularMarketPreviousClose) * 100).toFixed(2);

        const div = document.createElement('div');
        div.className = 'stock-item';
        div.innerHTML = `
        <div class="stock-left">
        <div class="mystock-symbol">${stock.symbol}</div>
        </div>
        <div class="stock-right">
        <div class="mystock-price">
            <span style="color: ${change >= 0 ? '#4ade80' : '#f87171'}; font-weight: 600;">
            (${change >= 0 ? '+' : ''}${change.toFixed(2)} / ${changePercent}%)
            </span>
        </div>
        </div>
    `;
        div.addEventListener('click', () => openModal('stock', stock.symbol));
        topStocks.appendChild(div);
    }

});