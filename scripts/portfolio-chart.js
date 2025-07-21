async function renderPortfolioChart(email) {
  const chartContainer = document.querySelector('.graph-placeholder');
  const canvas = document.createElement('canvas');
  canvas.id = 'portfolioGraph';

  // Fetch portfolio + history data
  const res = await fetch(`http://localhost:3000/api/portfolio?email=${encodeURIComponent(email)}`);
  const portfolioRes = await res.json();
  const portfolioCreatedAt = new Date(portfolioRes.portfolio.created_at);

  const now = new Date();
  const diffDays = Math.floor((now - portfolioCreatedAt) / (1000 * 60 * 60 * 24));

  if (diffDays < 10) {
    chartContainer.innerHTML = `<span class="graph-text">Not enough data (need 10 days)</span>`;
    return;
  }

  // Fetch history data
  const historyRes = await fetch(`http://localhost:3000/api/portfolio-history?email=${encodeURIComponent(email)}`);
  const data = await historyRes.json();

  if (!data || data.length < 2) {
    chartContainer.innerHTML = `<span class="graph-text">Not enough data to display</span>`;
    return;
  }

  // Clear placeholder and inject canvas
  chartContainer.innerHTML = '';
  chartContainer.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const labels = data.map(d => new Date(d.snapshot_date).toLocaleDateString());
  const values = data.map(d => parseFloat(d.total_value));

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '',
        data: values,
        borderColor: '#4ade80',
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          display: false
        },
        y: {
          display: false
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });
}


// Call this function once you have the portfolio ID available
const user = JSON.parse(localStorage.getItem('user'));
const email = user.email;
renderPortfolioChart(email);
