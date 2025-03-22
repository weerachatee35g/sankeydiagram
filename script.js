google.charts.load('current', { 'packages': ['sankey'] });
google.charts.setOnLoadCallback(updateSankey);

document.addEventListener('DOMContentLoaded', () => {
    // Add row functionality
    document.getElementById('add-row').addEventListener('click', () => {
        const tbody = document.querySelector('#data-table tbody');
        const rowCount = parseInt(document.getElementById('add-rows-count').value) || 1;
        for (let i = 0; i < rowCount; i++) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text" class="from"></td>
                <td><input type="text" class="to"></td>
                <td><input type="number" class="amount-current"></td>
                <td><input type="number" class="amount-comparison"></td>
                <td><button class="remove-row">×</button></td>
            `;
            tbody.appendChild(row);
        }
        updateSankey();
    });

    // Remove row functionality
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-row')) {
            if (document.querySelectorAll('#data-table tbody tr').length > 1) {
                e.target.parentElement.parentElement.remove();
                updateSankey();
            }
        }
    });

    // Update on input change
    document.querySelector('#data-table').addEventListener('input', updateSankey);
    document.getElementById('chart-title').addEventListener('input', updateSankey);
});

function updateSankey() {
    // Clear previous labels
    const container = document.getElementById('sankey-container');
    const existingLabels = container.querySelectorAll('.link-label');
    existingLabels.forEach(label => label.remove());

    // Get data from table
    const data = new google.visualization.DataTable();
    data.addColumn('string', 'From');
    data.addColumn('string', 'To');
    data.addColumn('number', 'Amount');
    data.addColumn({ type: 'string', role: 'tooltip' });

    const rows = [];
    const nodeData = {};
    const linkData = [];
    document.querySelectorAll('#data-table tbody tr').forEach(row => {
        const from = row.querySelector('.from').value;
        const to = row.querySelector('.to').value;
        const amountCurrent = parseFloat(row.querySelector('.amount-current').value);
        const amountComparison = parseFloat(row.querySelector('.amount-comparison').value);

        if (from && to && amountCurrent > 0) {
            // Calculate Y/Y growth
            const yoy = amountComparison > 0 ? ((amountCurrent - amountComparison) / amountComparison * 100).toFixed(0) : 0;

            // Store node data for labels
            if (!nodeData[from]) nodeData[from] = { amount: 0, yoy: 0 };
            if (!nodeData[to]) nodeData[to] = { amount: 0, yoy: 0 };
            nodeData[from].amount += amountCurrent;
            nodeData[to].amount += amountCurrent;
            nodeData[from].yoy = yoy;
            nodeData[to].yoy = yoy;

            rows.push([from, to, amountCurrent, `${from} to ${to}: $${amountCurrent}M`]);
            linkData.push({ from, to, amount: amountCurrent });
        }
    });
    data.addRows(rows);

    // Custom colors for nodes based on the example
    const nodeColors = {
        'Product A': '#4a4a4a',
        'Product B': '#4a4a4a',
        'Product C': '#4a4a4a',
        'Revenue': '#4a4a4a',
        'Cost of revenue': '#e74c3c',
        'Gross profit': '#2ecc71',
        'Operating expenses': '#e74c3c',
        'Operating profit': '#2ecc71',
        'Tax': '#e74c3c',
        'Net profit': '#2ecc71'
    };

    // Set chart options
    const options = {
        width: '100%',
        height: 500,
        sankey: {
            node: {
                label: {
                    fontName: 'Arial',
                    fontSize: 14,
                    color: '#333',
                    bold: false,
                    formatter: (value) => {
                        const node = nodeData[value];
                        if (node) {
                            return `${value}\n$${node.amount}M\n${node.yoy}% Y/Y`;
                        }
                        return value;
                    }
                },
                width: 20,
                interactivity: true,
                labelPadding: 10,
                nodePadding: 40,
                colors: Object.keys(nodeData).map(node => nodeColors[node] || '#4a4a4a')
            },
            link: {
                colorMode: 'source',
                fillOpacity: 0.4
            }
        },
        title: document.getElementById('chart-title').textContent,
        titleTextStyle: {
            fontName: 'Arial',
            fontSize: 24,
            color: '#2c3e50',
            bold: false
        }
    };

    // Instantiate and draw the chart
    const chart = new google.visualization.Sankey(document.getElementById('sankey-container'));
    chart.draw(data, options);

    // Add link labels
    setTimeout(() => {
        const svg = container.querySelector('svg');
        if (!svg) return;

        const paths = svg.querySelectorAll('path');
        paths.forEach((path, index) => {
            if (index < linkData.length) {
                const amount = linkData[index].amount;
                const pathLength = path.getTotalLength();
                const midPoint = path.getPointAtLength(pathLength / 2);

                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', midPoint.x);
                text.setAttribute('y', midPoint.y);
                text.setAttribute('class', 'link-label');
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dy', '-5');
                text.textContent = `$${amount}M`;
                svg.appendChild(text);
            }
        });
    }, 100); // Delay to ensure chart is rendered
}