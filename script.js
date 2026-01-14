// Recherche Google
document.getElementById('searchInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const query = e.target.value;
    if (query) {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
  }
});

// Boutons de navigation
document.getElementById('bookmarksBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://bookmarks/' });
});

document.getElementById('appsBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://apps/' });
});

document.getElementById('historyBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://history/' });
});

document.getElementById('downloadsBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'chrome://downloads/' });
});

document.getElementById('settingsBtn').addEventListener('click', () => {
  alert('Paramètres - À implémenter selon vos besoins');
});

// Fonction pour obtenir le favicon
function getFavicon(url) {
  try {
    const domain = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="%23ddd"/></svg>';
  }
}

// Créer le contenu d'une colonne
function createColumnContent(items, parentNode = null) {
  const content = document.createElement('div');
  content.className = 'column-content';
  
  // Bouton retour si on n'est pas à la racine
  if (parentNode) {
    const backBtn = document.createElement('div');
    backBtn.className = 'bookmark-item back-item';
    backBtn.innerHTML = `
      <span class="back-icon">←</span>
      <span class="bookmark-title">Retour</span>
    `;
    backBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const column = backBtn.closest('.bookmark-column');
      navigateBack(column, parentNode);
    });
    content.appendChild(backBtn);
  }
  
  items.forEach(item => {
    if (item.url) {
      // C'est un lien
      const linkEl = document.createElement('a');
      linkEl.className = 'bookmark-item';
      linkEl.href = item.url;
      linkEl.target = '_blank';
      
      const icon = document.createElement('img');
      icon.className = 'bookmark-icon';
      icon.src = getFavicon(item.url);
      icon.onerror = () => {
        icon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="%23ddd"/></svg>';
      };
      
      const title = document.createElement('span');
      title.className = 'bookmark-title';
      title.textContent = item.title || item.url;
      
      linkEl.appendChild(icon);
      linkEl.appendChild(title);
      content.appendChild(linkEl);
    } else if (item.children) {
      // C'est un dossier
      const folderEl = document.createElement('div');
      folderEl.className = 'bookmark-item folder-item';
      
      const icon = document.createElement('span');
      icon.className = 'folder-icon';
      icon.textContent = '📁';
      
      const title = document.createElement('span');
      title.className = 'bookmark-title';
      title.textContent = item.title;
      
      const arrow = document.createElement('span');
      arrow.className = 'folder-arrow';
      arrow.textContent = '→';
      
      folderEl.appendChild(icon);
      folderEl.appendChild(title);
      folderEl.appendChild(arrow);
      
      folderEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const column = folderEl.closest('.bookmark-column');
        navigateToFolder(column, item);
      });
      
      content.appendChild(folderEl);
    }
  });
  
  return content;
}

// Navigation vers un dossier (slide du contenu de la colonne)
function navigateToFolder(column, folderNode) {
  const wrapper = column.querySelector('.column-content-wrapper');
  const oldContent = column.querySelector('.column-content');
  
  // Animation de sortie vers la gauche
  oldContent.style.transform = 'translateX(-100%)';
  oldContent.style.opacity = '0';
  
  setTimeout(() => {
    // Créer le nouveau contenu
    const newContent = createColumnContent(folderNode.children, folderNode);
    
    // Préparer l'animation d'entrée depuis la droite
    newContent.style.transform = 'translateX(100%)';
    newContent.style.opacity = '0';
    
    // Remplacer le contenu
    oldContent.remove();
    wrapper.appendChild(newContent);
    
    // Lancer l'animation d'entrée
    setTimeout(() => {
      newContent.style.transform = 'translateX(0)';
      newContent.style.opacity = '1';
    }, 10);
  }, 300);
}

// Navigation retour
function navigateBack(column, parentNode) {
  const wrapper = column.querySelector('.column-content-wrapper');
  const oldContent = column.querySelector('.column-content');
  
  // Animation de sortie vers la droite
  oldContent.style.transform = 'translateX(100%)';
  oldContent.style.opacity = '0';
  
  setTimeout(() => {
    // Retrouver le contenu parent
    let items = [];
    if (parentNode && parentNode.parent) {
      items = parentNode.parent.children;
    } else {
      // Retour à la vue initiale de cette colonne
      const columnTitle = column.querySelector('.column-title').textContent;
      const rootData = column.dataset.rootData;
      if (rootData) {
        items = JSON.parse(rootData);
      }
    }
    
    const newContent = createColumnContent(items, parentNode ? parentNode.parent : null);
    
    // Préparer l'animation d'entrée depuis la gauche
    newContent.style.transform = 'translateX(-100%)';
    newContent.style.opacity = '0';
    
    // Remplacer le contenu
    oldContent.remove();
    wrapper.appendChild(newContent);
    
    // Lancer l'animation d'entrée
    setTimeout(() => {
      newContent.style.transform = 'translateX(0)';
      newContent.style.opacity = '1';
    }, 10);
  }, 300);
}

// Afficher tous les favoris (vue initiale)
function displayBookmarks(bookmarkNodes) {
  const grid = document.getElementById('bookmarksGrid');
  grid.innerHTML = '';
  
  let rootLinks = [];
  let rootFolders = [];
  
  // Extraire les liens et dossiers de niveau 1
  function extractRoot(nodes) {
    nodes.forEach(node => {
      if (node.children) {
        node.children.forEach(child => {
          if (child.url) {
            rootLinks.push(child);
          } else if (child.children && child.title && child.title !== '') {
            // Vérifier si le dossier a du contenu (liens ou sous-dossiers)
            const hasContent = child.children.some(c => c.url || (c.children && c.children.length > 0));
            if (hasContent) {
              rootFolders.push(child);
            }
          }
        });
      }
    });
  }
  
  extractRoot(bookmarkNodes);
  
  // Colonne 1 : Liens sans dossier (seulement si il y en a)
  if (rootLinks.length > 0) {
    const column = createColumn('Liens', rootLinks);
    grid.appendChild(column);
  }
  
  // Colonnes suivantes : Contenu de chaque dossier de niveau 1
  rootFolders.forEach(folder => {
    const column = createColumn(folder.title, folder.children, folder);
    grid.appendChild(column);
  });
  
  if (grid.innerHTML === '') {
    grid.innerHTML = '<div class="loading">Aucun favori trouvé. Ajoutez des dossiers dans vos favoris Chrome !</div>';
  }
}

// Créer une colonne complète
function createColumn(title, items, folderData = null) {
  const column = document.createElement('div');
  column.className = 'bookmark-column';
  
  if (folderData) {
    column.dataset.rootData = JSON.stringify(items);
  }
  
  const titleEl = document.createElement('div');
  titleEl.className = 'column-title';
  titleEl.textContent = title;
  column.appendChild(titleEl);
  
  const wrapper = document.createElement('div');
  wrapper.className = 'column-content-wrapper';
  
  const content = createColumnContent(items);
  wrapper.appendChild(content);
  
  column.appendChild(wrapper);
  
  return column;
}

// Mode démo
function displayDemoBookmarks() {
  const grid = document.getElementById('bookmarksGrid');
  grid.innerHTML = '';
  
  // Liens sans dossier
  const rootLinks = [
    { title: 'Google', url: 'https://google.com' },
    { title: 'YouTube', url: 'https://youtube.com' }
  ];
  
  const demoFolders = [
    {
      title: 'E-mail & Social',
      children: [
        { title: 'Facebook', url: 'https://facebook.com' },
        { title: 'Twitter', url: 'https://twitter.com' },
        { title: 'Gmail', url: 'https://gmail.com' },
        {
          title: 'Professionnel',
          children: [
            { title: 'LinkedIn', url: 'https://linkedin.com' },
            { title: 'Slack', url: 'https://slack.com' }
          ]
        }
      ]
    },
    {
      title: 'Web Dev',
      children: [
        { title: 'GitHub', url: 'https://github.com' },
        { title: 'Stack Overflow', url: 'https://stackoverflow.com' },
        {
          title: 'Documentation',
          children: [
            { title: 'MDN', url: 'https://developer.mozilla.org' },
            { title: 'CSS-Tricks', url: 'https://css-tricks.com' }
          ]
        }
      ]
    }
  ];
  
  // Colonne des liens racine
  const rootColumn = createColumn('Liens', rootLinks);
  grid.appendChild(rootColumn);
  
  // Colonnes des dossiers
  demoFolders.forEach(folder => {
    const column = createColumn(folder.title, folder.children, folder);
    grid.appendChild(column);
  });
}

// Charger les favoris au démarrage
function loadBookmarks() {
  if (typeof chrome !== 'undefined' && chrome.bookmarks) {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      displayBookmarks(bookmarkTreeNodes);
    });
  } else {
    displayDemoBookmarks();
  }
}

loadBookmarks();