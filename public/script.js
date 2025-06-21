document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const query = document.getElementById('search-input').value.trim();
    const resultsDiv = document.getElementById('search-results');

    resultsDiv.innerHTML = '<p>Carregando...</p>';

    try {
        const url = new URL('/api/search', window.location.origin);
        if (query) url.searchParams.append('query', query);

        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erro de rede: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.message) {
            resultsDiv.innerHTML = `<p>${data.message}</p>`;
        } else if (Array.isArray(data) && data.length > 0) {
            resultsDiv.innerHTML = data.map(item => `
                <hr> <div class="cep-result-item">
                    <p><strong>CEP:</strong> ${item.cep}</p>
                    <p><strong>Bairro:</strong> ${item.bairro}</p>
                    <p><strong>Rua:</strong> ${item.rua}</p>
                    </div>
            `).join('');
        } else {
            resultsDiv.innerHTML = '<p>Nenhum resultado encontrado para a sua busca.</p>';
        }
    } catch (error) {
        resultsDiv.innerHTML = `<p>Erro: ${error.message}. Por favor, tente novamente ou contate o suporte.</p>`;
        console.error('Erro durante a busca:', error);
    }
});