document.addEventListener('DOMContentLoaded', function() {
  // Elementos DOM
  const elements = {
    container: document.getElementById('booksContainer'),
    addBtn: document.getElementById('addBookBtn'),
    modal: document.getElementById('addBookModal'),
    form: document.getElementById('bookForm'),
    coverInput: document.getElementById('bookCover'),
    previewImg: document.getElementById('previewImage'),
    noImgText: document.getElementById('noImageText'),
    filterType: document.getElementById('filter-type'),
    filterGenre: document.getElementById('filter-genre')
  };

  // Estado
  let state = {
    books: [],
    genres: new Set()
  };

  // Funções principais
  async function fetchBooks() {
    try {
      showLoading();
      const response = await fetch('http://localhost:3000/api/obras');
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Dados inválidos');
      
      state.books = data;
      updateGenres();
      renderBooks();
    } catch (error) {
      showError(error);
    }
  }

  function renderBooks(books = state.books) {
    elements.container.innerHTML = '';
    
    if (books.length === 0) {
      elements.container.innerHTML = `
        <div class="no-books">
          <i class="fas fa-book-open"></i>
          <p>Nenhum livro encontrado</p>
        </div>
      `;
      return;
    }

    books.forEach(book => {
      const bookCard = document.createElement('div');
      bookCard.className = 'book-card';
      bookCard.innerHTML = `
        <div class="book-cover">
          <img src="${book.capa || 'https://via.placeholder.com/250x350?text=Sem+Capa'}" 
               alt="${book.titulo}"
               onerror="this.src='https://via.placeholder.com/250x350?text=Erro+ao+carregar'">
          <span class="type">${book.tipo === 'mangá' ? 'Mangá' : 'Livro'}</span>
        </div>
        <div class="book-info">
          <h3>${book.titulo}</h3>
          <p class="author">${book.autor}</p>
          <span class="genre">${book.genero || 'Sem gênero'}</span>
          <div class="book-actions">
            <button class="btn btn-danger" data-id="${book.id}">
              <i class="fas fa-trash"></i> Remover
            </button>
          </div>
        </div>
      `;
      elements.container.appendChild(bookCard);
    });

    // Eventos para botões de remover
    document.querySelectorAll('.btn-danger').forEach(btn => {
      btn.addEventListener('click', () => deleteBook(btn.dataset.id));
    });
  }

  // Funções auxiliares
  function updateGenres() {
    state.genres.clear();
    state.books.forEach(book => book.genero && state.genres.add(book.genero));
    
    elements.filterGenre.innerHTML = '<option value="all">Todos os Gêneros</option>';
    state.genres.forEach(genre => {
      const option = document.createElement('option');
      option.value = genre;
      option.textContent = genre;
      elements.filterGenre.appendChild(option);
    });
  }

  function filterBooks() {
    const type = elements.filterType.value;
    const genre = elements.filterGenre.value;
    
    let filtered = state.books;
    if (type !== 'all') filtered = filtered.filter(b => b.tipo === type);
    if (genre !== 'all') filtered = filtered.filter(b => b.genero === genre);
    
    renderBooks(filtered);
  }

  async function deleteBook(id) {
    if (!confirm('Tem certeza que deseja remover este livro?')) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/obras/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Erro ao remover livro');
      showAlert('Livro removido com sucesso!', 'success');
      fetchBooks();
    } catch (error) {
      showAlert('Erro ao remover livro', 'error');
    }
  }

  // Funções de UI
  function showLoading() {
    elements.container.innerHTML = `
      <div class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Carregando livros...</p>
      </div>
    `;
  }

  function showError(error) {
    console.error('Erro:', error);
    elements.container.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erro ao carregar livros</h3>
        <p>${error.message}</p>
        <button onclick="window.location.reload()" class="btn btn-primary">
          <i class="fas fa-sync-alt"></i> Tentar novamente
        </button>
      </div>
    `;
  }

  function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
      <p>${message}</p>
      <button class="close-alert">&times;</button>
    `;
    document.body.appendChild(alert);
    setTimeout(() => alert.classList.add('show'), 10);
    setTimeout(() => {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), 300);
    }, 3000);
    alert.querySelector('.close-alert').addEventListener('click', () => {
      alert.classList.remove('show');
      setTimeout(() => alert.remove(), 300);
    });
  }

  // Event Listeners
  elements.addBtn.addEventListener('click', () => {
    elements.modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  });

  document.querySelector('.close').addEventListener('click', () => {
    elements.modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    elements.form.reset();
    elements.previewImg.style.display = 'none';
    elements.noImgText.style.display = 'block';
    elements.coverInput.value = '';
  });

  elements.coverInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        elements.previewImg.src = e.target.result;
        elements.previewImg.style.display = 'block';
        elements.noImgText.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  });

  elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(elements.form);
    
    try {
      const response = await fetch('http://localhost:3000/api/obras', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Erro ao adicionar livro');
      
      showAlert('Livro adicionado com sucesso!', 'success');
      fetchBooks();
      elements.modal.classList.remove('show');
      document.body.style.overflow = 'auto';
    } catch (error) {
      showAlert('Erro ao adicionar livro', 'error');
    }
  });

  elements.filterType.addEventListener('change', filterBooks);
  elements.filterGenre.addEventListener('change', filterBooks);

  // Inicialização
  fetchBooks();
});