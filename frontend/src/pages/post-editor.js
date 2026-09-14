import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/page-header';
import AuthContext from '../context/auth-context';

const defaultCategories = ['Uncategorized'];
const textColors = ['#000000', '#4b5563', '#991b1b', '#b45309', '#166534', '#155e75', '#1d4ed8', '#581c87', '#be123c', '#dc2626', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#f8fafc'];
const specialCharacters = ['©', '®', '™', '€', '£', '¥', '¢', '§', '¶', '•', '…', '“', '”', '‘', '’', '«', '»', '×', '÷', '±', '≤', '≥', '≠', '∞', '←', '→', '↑', '↓', '♥', '★', '✓'];
const formatOptions = [
  ['p', 'Paragraph'],
  ['h1', 'Heading 1'],
  ['h2', 'Heading 2'],
  ['h3', 'Heading 3'],
  ['h4', 'Heading 4'],
  ['h5', 'Heading 5'],
  ['h6', 'Heading 6'],
  ['pre', 'Preformatted']
];
const basicToolbar = [
  ['bold', 'fa-solid fa-bold', 'Bold'],
  ['italic', 'fa-solid fa-italic', 'Italic'],
  ['insertUnorderedList', 'fa-solid fa-list-ul', 'Bulleted list'],
  ['insertOrderedList', 'fa-solid fa-list-ol', 'Numbered list'],
  ['formatBlock', 'fa-solid fa-quote-left', 'Blockquote', 'blockquote'],
  ['justifyLeft', 'fa-solid fa-align-left', 'Align left'],
  ['justifyCenter', 'fa-solid fa-align-center', 'Align center'],
  ['justifyRight', 'fa-solid fa-align-right', 'Align right'],
  ['createLink', 'fa-solid fa-link', 'Insert/edit link'],
  ['insertReadMore', 'fa-solid fa-ellipsis', 'Insert read more tag']
];
const extendedToolbarItems = [
  ['strikeThrough', 'fa-solid fa-strikethrough', 'Strikethrough'],
  ['insertHorizontalRule', 'fa-solid fa-minus', 'Horizontal line'],
  ['foreColor', 'fa-solid fa-font', 'Text color'],
  ['pasteAsText', 'fa-solid fa-paste', 'Paste as text'],
  ['removeFormat', 'fa-solid fa-eraser', 'Clear formatting'],
  ['specialCharacter', 'Ω', 'Special character'],
  ['outdent', 'fa-solid fa-outdent', 'Decrease indent'],
  ['indent', 'fa-solid fa-indent', 'Increase indent'],
  ['undo', 'fa-solid fa-rotate-left', 'Undo'],
  ['redo', 'fa-solid fa-rotate-right', 'Redo'],
  ['insertPageBreak', 'fa-solid fa-file-circle-plus', 'Insert Page Break Tag']
];
const keyboardShortcutGroups = [
  {
    title: 'Default shortcuts',
    shortcuts: [
      ['Ctrl + U', 'Underline'],
      ['Ctrl + B', 'Bold'],
      ['Ctrl + I', 'Italic'],
      ['Ctrl + X', 'Cut'],
      ['Ctrl + C', 'Copy'],
      ['Ctrl + A', 'Select all'],
      ['Ctrl + K', 'Insert/edit link'],
      ['Ctrl + V', 'Paste as text'],
      ['Ctrl + Z', 'Undo'],
      ['Ctrl + Y', 'Redo']
    ]
  },
  {
    title: 'Additional shortcuts (Shift + Alt)',
    shortcuts: [
      ['1', 'Heading 1'],
      ['2', 'Heading 2'],
      ['3', 'Heading 3'],
      ['4', 'Heading 4'],
      ['5', 'Heading 5'],
      ['6', 'Heading 6'],
      ['0', 'Paragraph'],
      ['Q', 'Blockquote'],
      ['D', 'Strikethrough'],
      ['C', 'Align center'],
      ['R', 'Align right'],
      ['L', 'Align left'],
      ['J', 'Justify'],
      ['U', 'Bulleted list'],
      ['O', 'Numbered list'],
      ['T', 'Insert read more tag'],
      ['P', 'Insert Page Break Tag'],
      ['M', 'Add Media'],
      ['Z', 'Extended toolbar'],
      ['H', 'Keyboard shortcuts']
    ]
  }
];

const createBlock = (type = 'paragraph', data = {}) => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  type,
  data: { text: '', ...data }
});

const optimizeImageDataUrl = (dataUrl, maxSize = 1600, quality = 0.82) => new Promise((resolve) => {
  const image = new Image();
  image.onload = () => {
    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    resolve(canvas.toDataURL('image/jpeg', quality));
  };
  image.onerror = () => resolve(dataUrl);
  image.src = dataUrl;
});

const parseContentBlocks = (content) => {
  if (!content) return [createBlock()];

  try {
    const parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.blocks)) {
      return parsed.blocks.map((block) => ({ ...block, id: block.id || createBlock().id }));
    }
  } catch (error) {
    // Existing posts may still contain HTML content.
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = content;
  const blocks = [...wrapper.children].map((element) => {
    if (/^H[1-6]$/.test(element.tagName)) return createBlock('header', { text: element.textContent });
    if (element.tagName === 'BLOCKQUOTE') return createBlock('quote', { text: element.textContent });
    if (element.tagName === 'IMG') return createBlock('image', { url: element.getAttribute('src') || '', caption: element.getAttribute('alt') || '' });
    return createBlock('paragraph', { text: element.textContent });
  });

  return blocks.length > 0 ? blocks : [createBlock()];
};

const combineBlocksIntoEditorContent = (parsedBlocks) => parsedBlocks.map((block) => {
  if (block.type === 'image' && block.data.url) {
    return `<img src="${block.data.url}" alt="${block.data.caption || 'Post image'}" />`;
  }
  return block.data.text || '';
}).filter(Boolean).join('<p><br></p>');

const PostEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateProfile } = useContext(AuthContext);
  const isEdit = Boolean(id);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    category: 'Uncategorized',
    tags: '',
    image: null,
    content: ''
  });
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [blocks, setBlocks] = useState([createBlock()]);
  const [openBlockMenu, setOpenBlockMenu] = useState(null);
  const [categoryList, setCategoryList] = useState(defaultCategories);
  const [categoryTab, setCategoryTab] = useState('all');
  const [collapsedPanels, setCollapsedPanels] = useState({});
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isExtendedToolbarOpen, setIsExtendedToolbarOpen] = useState(false);
  const [showSpecialCharacters, setShowSpecialCharacters] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const editorRefs = useRef({});
  const [activeEditorId, setActiveEditorId] = useState(null);
  const [activeCommands, setActiveCommands] = useState({});
  const [linkEditor, setLinkEditor] = useState({ id: null, url: '' });
  const [linkEditorRect, setLinkEditorRect] = useState(null);
  const [linkActions, setLinkActions] = useState(null);
  const [linkOptions, setLinkOptions] = useState({ text: '', newTab: false });
  const [showLinkOptions, setShowLinkOptions] = useState(false);
  const linkRanges = useRef({});
  const editorRanges = useRef({});
  const [colorEditorId, setColorEditorId] = useState(null);
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [customColor, setCustomColor] = useState('#000000');
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaTab, setMediaTab] = useState('upload');
  const [showMediaUrlInput, setShowMediaUrlInput] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const mediaFileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageOverlayRect, setImageOverlayRect] = useState(null);
  const [showImageLayout, setShowImageLayout] = useState(false);
  const [imageLayout, setImageLayout] = useState('inline');
  const [showImageDetails, setShowImageDetails] = useState(false);
  const [imageDetails, setImageDetails] = useState({ alt: '', caption: '', align: 'none', size: 'custom', width: '', height: '', link: 'none' });
  const [imageLinkUrl, setImageLinkUrl] = useState('');
  const resizeSession = useRef(null);

  const refreshActiveCommands = () => {
    if (!activeEditorId || !editorRefs.current[activeEditorId]) return;
    const editor = editorRefs.current[activeEditorId];
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !editor.contains(selection.anchorNode)) return;
    editorRanges.current[activeEditorId] = selection.getRangeAt(0).cloneRange();

    const commands = [...basicToolbar, ...extendedToolbarItems]
      .map(([command]) => command)
      .filter((command) => !['createLink', 'insertReadMore', 'insertHorizontalRule', 'foreColor', 'pasteAsText', 'specialCharacter'].includes(command))
      .reduce((current, command) => ({ ...current, [command]: document.queryCommandState(command) }), {});
    setActiveCommands(commands);
  };

  const rememberEditorSelection = (editorId) => {
    const selection = window.getSelection();
    const editor = editorRefs.current[editorId];
    if (selection?.rangeCount && editor?.contains(selection.anchorNode)) {
      editorRanges.current[editorId] = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreEditorSelection = (editorId) => {
    const range = editorRanges.current[editorId];
    if (!range) return;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  useEffect(() => {
    document.addEventListener('selectionchange', refreshActiveCommands);
    return () => document.removeEventListener('selectionchange', refreshActiveCommands);
  }, [activeEditorId]);

  useEffect(() => {
    document.execCommand('enableObjectResizing', false, true);
  }, []);

  useEffect(() => {
    if (!linkEditor.id) return undefined;
    const syncLinkEditorPosition = () => {
      const range = linkRanges.current[linkEditor.id];
      if (!range) return;
      const rect = range.getBoundingClientRect();
      setLinkEditorRect({ left: Math.max(8, rect.left), top: Math.min(window.innerHeight - 80, rect.bottom + 8) });
    };
    window.addEventListener('scroll', syncLinkEditorPosition, true);
    window.addEventListener('resize', syncLinkEditorPosition);
    return () => {
      window.removeEventListener('scroll', syncLinkEditorPosition, true);
      window.removeEventListener('resize', syncLinkEditorPosition);
    };
  }, [linkEditor.id]);

  useEffect(() => {
    if (!linkActions?.element) return undefined;
    const syncLinkActions = () => setLinkActions((current) => current ? { ...current, rect: current.element.getBoundingClientRect() } : current);
    window.addEventListener('scroll', syncLinkActions, true);
    window.addEventListener('resize', syncLinkActions);
    return () => {
      window.removeEventListener('scroll', syncLinkActions, true);
      window.removeEventListener('resize', syncLinkActions);
    };
  }, [linkActions?.element]);

  useEffect(() => {
    if (!linkActions) return undefined;
    const closeLinkActions = (event) => {
      if (!event.target.closest('a') && !event.target.closest('[data-link-actions]')) {
        setLinkActions(null);
      }
    };
    document.addEventListener('mousedown', closeLinkActions);
    return () => document.removeEventListener('mousedown', closeLinkActions);
  }, [linkActions]);

  useEffect(() => {
    if (!selectedImage?.element) return undefined;
    const syncImageOverlay = () => {
      const rect = selectedImage.element.getBoundingClientRect();
      const isVisible = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
      setImageOverlayRect(isVisible ? rect : null);
    };
    window.addEventListener('scroll', syncImageOverlay, true);
    window.addEventListener('resize', syncImageOverlay);
    syncImageOverlay();
    return () => {
      window.removeEventListener('scroll', syncImageOverlay, true);
      window.removeEventListener('resize', syncImageOverlay);
    };
  }, [selectedImage]);

  useEffect(() => {
    const closeColorDropdown = (event) => {
      if (!event.target.closest('[data-color-dropdown]')) {
        setColorEditorId(null);
        setShowCustomColor(false);
      }
    };

    document.addEventListener('mousedown', closeColorDropdown);
    return () => document.removeEventListener('mousedown', closeColorDropdown);
  }, []);

  useEffect(() => {
    if (!user) return;

    const posts = Array.isArray(user.posts) ? user.posts : [];
    const draftKey = `testsite-drafts-${String(user.email || user.username || 'anonymous').toLowerCase()}`;
    const savedDrafts = JSON.parse(localStorage.getItem(draftKey) || '[]');
    const drafts = Array.isArray(savedDrafts) ? savedDrafts : [];
    const savedCategories = posts
      .map((post) => String(post.category || '').trim())
      .filter(Boolean);
    setCategoryList((current) => [...new Set([...current, ...savedCategories])]);

    if (isEdit) {
      const existingPost = posts.find((post) => String(post.id) === String(id))
        || drafts.find((draft) => String(draft.id) === String(id));

      if (existingPost) {
        const parsedBlocks = parseContentBlocks(existingPost.content || '');
        setForm({
          title: existingPost.title || '',
          slug: existingPost.slug || '',
          category: existingPost.category || 'Uncategorized',
          tags: Array.isArray(existingPost.tags) ? existingPost.tags.join(', ') : existingPost.tags || '',
          image: existingPost.featuredImage || existingPost.image || null,
          content: existingPost.content || ''
        });
        setTagInput('');
        setBlocks([{ ...createBlock(), data: { text: combineBlocksIntoEditorContent(parsedBlocks) } }]);
        return;
      }
    }

    setForm({
      title: '',
      slug: '',
      category: 'Uncategorized',
      tags: '',
      image: null,
      content: ''
    });
    setTagInput('');
    setBlocks([createBlock()]);
  }, [id, isEdit, user]);

  useEffect(() => {
    if (user && !user.confirmed) {
      navigate(`/confirm?email=${encodeURIComponent(user.email || '')}`, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    blocks.forEach((block) => {
      const editor = editorRefs.current[block.id];
      const content = block.data.text || '';
      if (editor && editor.innerHTML !== content) {
        editor.innerHTML = content;
      }
    });
  }, [blocks]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    const handleDocumentClick = (event) => {
      const anchor = event.target.closest('a');

      if (!isDirty || !anchor) return;
      if (anchor.closest('[contenteditable="true"]')) return;

      const targetUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      if (targetUrl.origin !== currentUrl.origin) {
        event.preventDefault();
        handleLeave('/account');
        return;
      }

      if (targetUrl.pathname !== currentUrl.pathname) {
        event.preventDefault();
        handleLeave('/account');
      }
    };

    const handlePopState = () => {
      if (isDirty) {
        setPendingNavigation('/account');
        setPendingAction('save');
        setShowConfirm(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleDocumentClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleDocumentClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDirty]);

  const handleChange = (event) => {
    const { name, value, files, type } = event.target;

    if (type === 'file' && files && files[0]) {
      const file = files[0];
      const reader = new FileReader();

      reader.onload = () => {
        optimizeImageDataUrl(reader.result).then((optimizedImage) => {
          setForm((prev) => ({
            ...prev,
            image: optimizedImage
          }));
          setIsDirty(true);
        });
      };

      reader.readAsDataURL(file);
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
    setIsDirty(true);
  };

  const handleAddCategory = () => {
    const category = newCategory.trim();
    if (!category) return;

    setCategoryList((current) => current.includes(category) ? current : [...current, category]);
    setForm((current) => ({ ...current, category }));
    setNewCategory('');
    setParentCategory('');
    setShowAddCategory(false);
    setIsDirty(true);
  };

  const getTags = () => form.tags.split(',').map((tag) => tag.trim()).filter(Boolean);

  const handleAddTag = () => {
    const nextTag = tagInput.trim();
    if (!nextTag) return;

    const tags = getTags();
    if (!tags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())) {
      setForm((current) => ({ ...current, tags: [...getTags(), nextTag].join(', ') }));
      setIsDirty(true);
    }
    setTagInput('');
  };

  const handleTagInputChange = (event) => {
    const value = event.target.value;
    if (!value.includes(',')) {
      setTagInput(value);
      return;
    }

    const enteredTags = value.split(',').map((tag) => tag.trim()).filter(Boolean);
    const existingTags = getTags();
    const nextTags = [...existingTags];
    enteredTags.forEach((tag) => {
      if (!nextTags.some((existingTag) => existingTag.toLowerCase() === tag.toLowerCase())) {
        nextTags.push(tag);
      }
    });
    setForm((current) => ({ ...current, tags: nextTags.join(', ') }));
    setTagInput('');
    setIsDirty(true);
  };

  const handleTagKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setForm((current) => ({
      ...current,
      tags: getTags().filter((tag) => tag !== tagToRemove).join(', ')
    }));
    setIsDirty(true);
  };

  const mostUsedCategories = categoryList
    .map((category) => ({
      category,
      count: (user?.posts || []).filter((post) => post.category === category).length
    }))
    .sort((left, right) => right.count - left.count)
    .map(({ category }) => category);

  const visibleCategories = categoryTab === 'all' ? categoryList : mostUsedCategories;

  const updateBlocks = (nextBlocks) => {
    setBlocks(nextBlocks);
    setForm((prev) => ({ ...prev, content: JSON.stringify({ time: Date.now(), blocks: nextBlocks }) }));
    setIsDirty(true);
  };

  const addBlock = (type) => updateBlocks([...blocks, createBlock(type)]);

  const addToolbarBlock = (type) => {
    const nextBlock = createBlock(type);
    const activeIndex = blocks.findIndex((block) => block.id === activeEditorId);
    const nextBlocks = activeIndex >= 0
      ? [...blocks.slice(0, activeIndex + 1), nextBlock, ...blocks.slice(activeIndex + 1)]
      : [...blocks, nextBlock];
    updateBlocks(nextBlocks);
    setActiveEditorId(nextBlock.id);
  };

  const placeCaretAtEnd = (element) => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const getSelectedBlockElement = (editor) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;
    let element = selection.anchorNode?.nodeType === Node.ELEMENT_NODE
      ? selection.anchorNode
      : selection.anchorNode?.parentElement;

    while (element && element !== editor) {
      if (['P', 'DIV', 'LI', 'BLOCKQUOTE'].includes(element.tagName)) return element;
      element = element.parentElement;
    }
    return null;
  };

  const getIndentTarget = (editor) => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return null;
    let element = selection.anchorNode?.nodeType === Node.ELEMENT_NODE
      ? selection.anchorNode
      : selection.anchorNode?.parentElement;

    while (element && element !== editor) {
      if (['P', 'LI', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE'].includes(element.tagName)) return element;
      if (element.tagName === 'DIV' && (!element.querySelector('p, li, blockquote, h1, h2, h3, h4, h5, h6, pre') || element.parentElement === editor)) return element;
      element = element.parentElement;
    }
    return null;
  };

  const runEditorCommand = (command, value = null, editorId = activeEditorId) => {
    const editor = editorRefs.current[editorId];
    if (!editor) return;
    setActiveEditorId(editorId);
    let format = null;
    editor.focus();
    if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
      const listTag = command === 'insertOrderedList' ? 'ol' : 'ul';
      if (!editor.textContent.trim() && !editor.querySelector('li')) {
        editor.innerHTML = `<${listTag}><li><br></li></${listTag}>`;
        placeCaretAtEnd(editor.querySelector('li'));
      } else {
        document.execCommand(command, false, value);
      }
    } else if (command === 'formatBlock' && value === 'blockquote') {
      const selectedBlock = getSelectedBlockElement(editor);
      const existingQuote = selectedBlock?.closest('blockquote');
      if (existingQuote) {
        const paragraph = document.createElement('p');
        paragraph.innerHTML = existingQuote.innerHTML;
        existingQuote.replaceWith(paragraph);
        format = 'p';
      } else {
        const quote = document.createElement('blockquote');
        if (selectedBlock && selectedBlock !== editor) {
          quote.innerHTML = selectedBlock.innerHTML || '<br>';
          selectedBlock.replaceWith(quote);
        } else {
          document.execCommand('formatBlock', false, 'blockquote');
        }
        format = 'blockquote';
      }
      placeCaretAtEnd(editor.querySelector('blockquote') || editor);
    } else if (command === 'indent' || command === 'outdent') {
      let selectedBlock = getIndentTarget(editor);
      if (!selectedBlock) {
        const selection = window.getSelection();
        let directChild = selection?.anchorNode;
        while (directChild && directChild.parentNode !== editor) directChild = directChild.parentNode;
        if (directChild) {
          selectedBlock = document.createElement('div');
          editor.insertBefore(selectedBlock, directChild);
          selectedBlock.appendChild(directChild);
        }
      }
      if (selectedBlock) {
        const currentIndent = Number.parseInt(selectedBlock.dataset.indent || '0', 10) || 0;
        const indentChange = command === 'indent' ? 40 : -40;
        const nextIndent = Math.max(0, currentIndent + indentChange);
        selectedBlock.dataset.indent = String(nextIndent);
        selectedBlock.style.marginLeft = nextIndent ? `${nextIndent}px` : '';
      }
    } else if (command === 'insertReadMore') {
      document.execCommand('insertHTML', false, '<div data-read-more="true" contenteditable="false"><span>MORE</span></div><p><br></p>');
      const paragraphs = editor.querySelectorAll('p');
      placeCaretAtEnd(paragraphs[paragraphs.length - 1] || editor);
    } else if (command === 'insertPageBreak') {
      document.execCommand('insertHTML', false, '<div data-page-break="true" contenteditable="false"><span>PAGE BREAK</span></div><!--nextpage--><p><br></p>');
      const paragraphs = editor.querySelectorAll('p');
      placeCaretAtEnd(paragraphs[paragraphs.length - 1] || editor);
    } else if (command === 'createLink') {
      const selection = window.getSelection();
      const selectedLink = selection?.anchorNode?.parentElement?.closest('a');
      const selectedRange = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
      linkRanges.current[editorId] = selectedRange;
      setLinkEditor({ id: editorId, url: selectedLink?.getAttribute('href') || '' });
      setLinkOptions({ text: selectedLink?.textContent || selection?.toString() || '', newTab: selectedLink?.target === '_blank' });
      setShowLinkOptions(false);
      if (selectedRange) {
        const rect = selectedRange.getBoundingClientRect();
        setLinkEditorRect({ left: Math.max(8, rect.left), top: Math.min(window.innerHeight - 80, rect.bottom + 8) });
      }
      return;
    } else if (command === 'formatBlock') {
      document.execCommand(command, false, value);
    } else if (command === 'foreColor') {
      setColorEditorId(editorId);
      return;
    } else if (command === 'pasteAsText') {
      navigator.clipboard?.readText().then((text) => {
        if (!text) return;
        editor.focus();
        document.execCommand('insertText', false, text);
        updateBlock(editorId, { text: editor.innerHTML });
      }).catch(() => {});
      return;
    } else {
      document.execCommand(command, false, value);
    }
    updateBlock(editorId, { text: editor.innerHTML, ...(format ? { format } : {}) });
    requestAnimationFrame(refreshActiveCommands);
  };

  const applyTextColor = (color) => {
    const editor = editorRefs.current[colorEditorId];
    if (!editor) return;
    editor.focus();
    restoreEditorSelection(colorEditorId);
    document.execCommand('foreColor', false, color);
    updateBlock(colorEditorId, { text: editor.innerHTML });
    setColorEditorId(null);
    setShowCustomColor(false);
    requestAnimationFrame(refreshActiveCommands);
  };

  const applyLink = () => {
    const editor = editorRefs.current[linkEditor.id];
    const url = linkEditor.url.trim();
    if (!editor || !url) return;

    editor.focus();
    const range = linkRanges.current[linkEditor.id];
    const selection = window.getSelection();
    if (range) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    const selectedLink = selection.anchorNode?.parentElement?.closest('a');
    if (selectedLink && editor.contains(selectedLink)) {
      selectedLink.href = url;
      selectedLink.target = linkOptions.newTab ? '_blank' : '';
      selectedLink.rel = linkOptions.newTab ? 'noreferrer' : '';
      if (linkOptions.text.trim()) selectedLink.textContent = linkOptions.text.trim();
    } else {
      const selectedText = selection.toString();
      if (selectedText && linkOptions.text.trim() && linkOptions.text.trim() !== selectedText) {
        const range = selection.getRangeAt(0);
        const link = document.createElement('a');
        link.href = url;
        link.textContent = linkOptions.text.trim();
        link.target = linkOptions.newTab ? '_blank' : '';
        link.rel = linkOptions.newTab ? 'noreferrer' : '';
        range.deleteContents();
        range.insertNode(link);
      } else {
        document.execCommand('createLink', false, url);
        const createdLink = selection.anchorNode?.parentElement?.closest('a');
        if (createdLink) {
          createdLink.target = linkOptions.newTab ? '_blank' : '';
          createdLink.rel = linkOptions.newTab ? 'noreferrer' : '';
        }
      }
    }
    updateBlock(linkEditor.id, { text: editor.innerHTML });
    setLinkEditor({ id: null, url: '' });
    setLinkEditorRect(null);
    setShowLinkOptions(false);
    requestAnimationFrame(refreshActiveCommands);
  };

  const handleExistingLinkClick = (blockId, event) => {
    const link = event.target.closest('a');
    if (!link) return false;
    if (event.target.closest('img')) return false;
    event.preventDefault();
    event.stopPropagation();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(link);
    selection.removeAllRanges();
    selection.addRange(range);
    linkRanges.current[blockId] = range.cloneRange();
    setActiveEditorId(blockId);
    setLinkActions({ blockId, element: link, rect: link.getBoundingClientRect() });
    return true;
  };

  const editExistingLink = () => {
    if (!linkActions) return;
    const { blockId, element, rect } = linkActions;
    setLinkEditor({ id: blockId, url: element.getAttribute('href') || '' });
    setLinkOptions({ text: element.textContent || '', newTab: element.target === '_blank' });
    setLinkEditorRect({ left: Math.max(8, rect.left), top: Math.min(window.innerHeight - 80, rect.bottom + 8) });
    setLinkActions(null);
  };

  const removeExistingLink = () => {
    if (!linkActions) return;
    const { blockId, element } = linkActions;
    element.replaceWith(document.createTextNode(element.textContent || ''));
    updateBlock(blockId, { text: editorRefs.current[blockId].innerHTML });
    setLinkActions(null);
  };

  const handleEditorInput = (id, event) => updateBlock(id, { text: event.currentTarget.innerHTML });

  const handleEditorPaste = (id, event) => {
    event.preventDefault();
    const plainText = event.clipboardData.getData('text/plain');
    if (!plainText) return;
    const editor = editorRefs.current[id];
    if (!editor) return;
    document.execCommand('insertText', false, plainText);
    updateBlock(id, { text: editor.innerHTML });
  };

  const selectEditorImage = (blockId, event) => {
    setActiveEditorId(blockId);
    if (event.target.tagName !== 'IMG') {
      setSelectedImage(null);
      setImageOverlayRect(null);
      return;
    }
    setSelectedImage({ element: event.target, editorId: blockId });
    setImageLayout(event.target.dataset.layout || 'inline');
    setShowImageLayout(false);
    const imageFigure = event.target.closest('figure[data-editor-image]');
    setImageDetails((current) => ({ ...current, alt: event.target.alt || '', caption: imageFigure?.querySelector('figcaption')?.textContent || '', width: Math.round(event.target.getBoundingClientRect().width), height: Math.round(event.target.getBoundingClientRect().height) }));
    setImageOverlayRect(event.target.getBoundingClientRect());
  };

  const alignSelectedImage = (align) => {
    if (!selectedImage?.element) return;
    const image = selectedImage.element;
    const figure = image.closest('figure[data-editor-image]');
    const target = figure || image;

    target.style.float = 'none';
    target.style.display = 'block';
    target.style.width = 'fit-content';
    target.style.maxWidth = '100%';
    target.style.margin = align === 'center'
      ? '1rem auto'
      : align === 'right'
        ? '1rem 0 1rem auto'
        : '1rem 0';
    image.style.float = '';
    image.style.display = 'block';
    image.style.marginLeft = '0';
    image.style.marginRight = '0';
    if (figure) {
      figure.dataset.align = align;
    }
    image.dataset.align = align;
    setImageDetails((current) => ({ ...current, align }));
    requestAnimationFrame(() => {
      setImageOverlayRect(image.getBoundingClientRect());
      const editor = editorRefs.current[selectedImage.editorId];
      if (editor) updateBlock(selectedImage.editorId, { text: editor.innerHTML });
    });
  };

  const openImageDetails = () => {
    setShowImageLayout(false);
    const existingLink = selectedImage?.element?.closest('a');
    setImageLinkUrl(existingLink?.getAttribute('href') || '');
    setImageDetails((current) => ({ ...current, link: existingLink ? 'custom' : 'none' }));
    setShowImageDetails(true);
  };

  const updateImageDetails = () => {
    if (!selectedImage?.element) return;
    const image = selectedImage.element;
    image.alt = imageDetails.alt;
    const existingLink = image.closest('a');
    let imageFigure = image.closest('figure[data-editor-image]');

    // Keep the link around the image only; captions must remain plain text.
    if (existingLink) {
      const linkHref = existingLink.getAttribute('href') || '';
      if (!imageFigure) {
        imageFigure = document.createElement('figure');
        imageFigure.dataset.editorImage = 'true';
        existingLink.parentNode.insertBefore(imageFigure, existingLink);
        imageFigure.appendChild(image);
      } else {
        existingLink.parentNode.insertBefore(imageFigure, existingLink);
      }
      existingLink.remove();
      if (imageDetails.link === 'custom' && imageLinkUrl.trim()) {
        const link = document.createElement('a');
        link.href = imageLinkUrl.trim() || linkHref;
        link.target = '_blank';
        link.rel = 'noreferrer';
        imageFigure.insertBefore(link, image);
        link.appendChild(image);
      }
    }

    if (imageDetails.caption.trim()) {
      if (!imageFigure) {
        imageFigure = document.createElement('figure');
        imageFigure.dataset.editorImage = 'true';
        image.parentNode.insertBefore(imageFigure, image);
        imageFigure.appendChild(image);
      }
      let caption = imageFigure.querySelector('figcaption');
      if (!caption) {
        caption = document.createElement('figcaption');
        imageFigure.appendChild(caption);
      }
      caption.textContent = imageDetails.caption.trim();
    } else if (imageFigure) {
      imageFigure.replaceWith(image);
    }
    if (imageDetails.width) image.style.width = `${imageDetails.width}px`;
    if (imageDetails.height) image.style.height = `${imageDetails.height}px`;
    alignSelectedImage(imageDetails.align);
    if (!existingLink && imageDetails.link === 'custom' && imageLinkUrl.trim()) {
      const link = document.createElement('a');
      link.href = imageLinkUrl.trim();
      link.target = '_blank';
      link.rel = 'noreferrer';
      image.parentNode.insertBefore(link, image);
      link.appendChild(image);
    }
    updateBlock(selectedImage.editorId, { text: editorRefs.current[selectedImage.editorId].innerHTML });
    setShowImageDetails(false);
    setImageOverlayRect(image.getBoundingClientRect());
  };

  const removeSelectedImage = () => {
    if (!selectedImage?.element) return;
    const editor = editorRefs.current[selectedImage.editorId];
    selectedImage.element.remove();
    updateBlock(selectedImage.editorId, { text: editor.innerHTML });
    setSelectedImage(null);
    setImageOverlayRect(null);
  };

  const applyImageLayout = (layout) => {
    if (!selectedImage?.element) return;
    const image = selectedImage.element;
    image.dataset.layout = layout;
    image.style.position = '';
    image.style.zIndex = '';
    image.style.clear = '';
    image.style.verticalAlign = '';
    image.style.display = '';
    image.style.float = '';
    image.style.margin = '';

    if (layout === 'inline') {
      image.style.display = 'inline-block';
      image.style.verticalAlign = 'middle';
      image.style.margin = '0 0.5rem';
    } else if (['square', 'tight', 'through'].includes(layout)) {
      image.style.float = 'left';
      image.style.margin = '0 1rem 0.75rem 0';
    } else if (layout === 'top-bottom') {
      image.style.display = 'block';
      image.style.clear = 'both';
      image.style.margin = '1rem 0';
    } else if (layout === 'behind') {
      image.style.position = 'relative';
      image.style.zIndex = '-1';
    } else if (layout === 'front') {
      image.style.position = 'relative';
      image.style.zIndex = '1';
    }

    setImageLayout(layout);
    setImageOverlayRect(image.getBoundingClientRect());
    if (selectedImage.editorId && editorRefs.current[selectedImage.editorId]) {
      updateBlock(selectedImage.editorId, { text: editorRefs.current[selectedImage.editorId].innerHTML });
    }
  };

  const startImageResize = (event, handle) => {
    event.preventDefault();
    event.stopPropagation();
    if (!selectedImage?.element) return;
    const image = selectedImage.element;
    const rect = image.getBoundingClientRect();
    resizeSession.current = {
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      ratio: rect.width / rect.height
    };

    const resize = (moveEvent) => {
      const session = resizeSession.current;
      if (!session) return;
      const horizontalDirection = session.handle.includes('e') ? 1 : session.handle.includes('w') ? -1 : 0;
      const verticalDirection = session.handle.includes('s') ? 1 : session.handle.includes('n') ? -1 : 0;
      const horizontalSize = session.startWidth + ((moveEvent.clientX - session.startX) * horizontalDirection);
      const verticalSize = session.startHeight + ((moveEvent.clientY - session.startY) * verticalDirection);
      const width = Math.max(40, horizontalDirection ? horizontalSize : verticalSize * session.ratio);
      const height = Math.max(40, verticalDirection ? verticalSize : horizontalSize / session.ratio);
      image.style.width = `${width}px`;
      image.style.height = `${height}px`;
      setImageOverlayRect(image.getBoundingClientRect());
    };

    const stopResize = () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
      if (selectedImage.editorId && editorRefs.current[selectedImage.editorId]) {
        updateBlock(selectedImage.editorId, { text: editorRefs.current[selectedImage.editorId].innerHTML });
      }
      resizeSession.current = null;
    };

    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResize);
  };

  const insertMedia = (source) => {
    const editorId = activeEditorId;
    const editor = editorRefs.current[editorId];
    if (!editor || !source) return;

    editor.focus();
    const selection = window.getSelection();
    const range = editorRanges.current[editorId];
    if (range && editor.contains(range.commonAncestorContainer)) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    document.execCommand('insertHTML', false, `<img src="${source.replace(/"/g, '&quot;')}" alt="" />`);
    updateBlock(editorId, { text: editor.innerHTML });
    setMediaUrl('');
    setShowMediaUrlInput(false);
    setShowMediaModal(false);
  };

  const handleMediaFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => insertMedia(reader.result);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleEditorKeyDown = (id, event) => {
    const shortcutKey = event.key.toLowerCase();
    if (event.shiftKey && event.altKey && !event.ctrlKey && !event.metaKey) {
      const formatShortcut = { '0': 'p', '1': 'h1', '2': 'h2', '3': 'h3', '4': 'h4', '5': 'h5', '6': 'h6' }[shortcutKey];
      if (formatShortcut) {
        event.preventDefault();
        handleFormatChange(id, formatShortcut);
        return;
      }

      const commandShortcuts = {
        q: ['formatBlock', 'blockquote'],
        d: ['strikeThrough'],
        c: ['justifyCenter'],
        r: ['justifyRight'],
        l: ['justifyLeft'],
        j: ['justifyFull'],
        u: ['insertUnorderedList'],
        o: ['insertOrderedList'],
        t: ['insertReadMore'],
        p: ['insertPageBreak'],
        z: ['toggleExtendedToolbar'],
        m: ['openMedia'],
        h: ['openKeyboardShortcuts']
      };
      const shortcut = commandShortcuts[shortcutKey];
      if (shortcut) {
        event.preventDefault();
        if (shortcut[0] === 'toggleExtendedToolbar') {
          setIsExtendedToolbarOpen((current) => !current);
        } else if (shortcut[0] === 'openMedia') {
          setActiveEditorId(id);
          rememberEditorSelection(id);
          setMediaTab('upload');
          setShowMediaUrlInput(false);
          setShowMediaModal(true);
        } else if (shortcut[0] === 'openKeyboardShortcuts') {
          setShowKeyboardShortcuts(true);
        } else {
          runEditorCommand(shortcut[0], shortcut[1] || null, id);
        }
        return;
      }
    }

    if ((event.ctrlKey || event.metaKey) && !event.altKey && (event.key.toLowerCase() === 'z' || event.key.toLowerCase() === 'y')) {
      event.preventDefault();
      runEditorCommand(event.key.toLowerCase() === 'z' ? 'undo' : 'redo', null, id);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && !event.altKey && shortcutKey === 'b') {
      event.preventDefault();
      runEditorCommand('bold', null, id);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && !event.altKey && shortcutKey === 'i') {
      event.preventDefault();
      runEditorCommand('italic', null, id);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && !event.altKey && shortcutKey === 'u') {
      event.preventDefault();
      runEditorCommand('underline', null, id);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && !event.altKey && shortcutKey === 'k') {
      event.preventDefault();
      runEditorCommand('createLink', null, id);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && !event.altKey && shortcutKey === 'v') {
      event.preventDefault();
      runEditorCommand('pasteAsText', null, id);
      return;
    }

    if (event.key !== 'Enter') return;

    const editor = editorRefs.current[id];
    const selection = window.getSelection();
    const caption = selection?.anchorNode?.parentElement?.closest('figcaption');
    if (editor && caption && editor.contains(caption) && selection.isCollapsed) {
      const figure = caption.closest('figure[data-editor-image]');
      if (figure) {
        event.preventDefault();
        if (caption.dataset.exitPending === 'true') {
          delete caption.dataset.exitPending;
          const paragraph = document.createElement('p');
          paragraph.innerHTML = '<br>';
          paragraph.dataset.indent = '0';
          figure.after(paragraph);
          const range = document.createRange();
          range.setStart(paragraph, 0);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          const range = selection.getRangeAt(0);
          const lineBreak = document.createElement('br');
          lineBreak.dataset.captionBreak = 'true';
          range.insertNode(lineBreak);
          range.setStartAfter(lineBreak);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          caption.dataset.exitPending = 'true';
        }
        setActiveEditorId(id);
        updateBlock(id, { text: editor.innerHTML });
        return;
      }
    }
    const selectedBlock = getIndentTarget(editor);
    let isCollapsedAtEnd = false;
    if (selection?.rangeCount && selection.isCollapsed && selectedBlock?.contains(selection.anchorNode)) {
      const afterCaret = selection.getRangeAt(0).cloneRange();
      afterCaret.selectNodeContents(selectedBlock);
      afterCaret.setStart(selection.anchorNode, selection.anchorOffset);
      isCollapsedAtEnd = afterCaret.toString().trim() === '';
    }
    const currentIndent = selectedBlock
      ? Number.parseInt(selectedBlock.dataset.indent || window.getComputedStyle(selectedBlock).marginLeft || '0', 10) || 0
      : 0;
    if (editor && selectedBlock?.tagName === 'LI' && isCollapsedAtEnd) {
      const list = selectedBlock.closest('ol, ul');
      if (list && selectedBlock === list.lastElementChild) {
        if (selectedBlock.textContent.trim()) return;
        event.preventDefault();
        const paragraph = document.createElement('p');
        paragraph.innerHTML = '<br>';
        paragraph.dataset.indent = '0';
        let exitContainer = list;
        let parent = list.parentElement;
        while (parent && parent !== editor) {
          const parentIndent = Number.parseInt(parent.dataset.indent || window.getComputedStyle(parent).marginLeft || '0', 10) || 0;
          if (parentIndent > 0) {
            exitContainer = parent;
            break;
          }
          parent = parent.parentElement;
        }
        selectedBlock.remove();
        exitContainer.after(paragraph);
        const range = document.createRange();
        range.setStart(paragraph, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        setActiveEditorId(id);
        updateBlock(id, { text: editor.innerHTML });
        return;
      }
    }
    if (editor && selectedBlock && currentIndent > 0 && isCollapsedAtEnd) {
      event.preventDefault();
      const paragraph = document.createElement('p');
      paragraph.innerHTML = '<br>';
      paragraph.dataset.indent = '0';
      paragraph.style.marginLeft = '';
      selectedBlock.after(paragraph);
      const range = document.createRange();
      range.setStart(paragraph, 0);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      setActiveEditorId(id);
      updateBlock(id, { text: editor.innerHTML });
      return;
    }
    const quote = selection?.anchorNode?.parentElement?.closest('blockquote');
    if (!editor || !quote || !editor.contains(quote)) return;

    event.preventDefault();
    const paragraph = document.createElement('p');
    paragraph.innerHTML = '<br>';
    quote.after(paragraph);

    const range = document.createRange();
    range.setStart(paragraph, 0);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    setActiveEditorId(id);
    updateBlock(id, { text: editor.innerHTML });
  };

  const handleFormatChange = (id, format) => {
    setActiveEditorId(id);
    const editor = editorRefs.current[id];
    if (!editor) return;
    editor.focus();
    restoreEditorSelection(id);
    const selectedBlock = getSelectedBlockElement(editor);
    if (selectedBlock && selectedBlock !== editor && ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'BLOCKQUOTE'].includes(selectedBlock.tagName)) {
      const formattedBlock = document.createElement(format);
      formattedBlock.innerHTML = selectedBlock.innerHTML || '<br>';
      selectedBlock.replaceWith(formattedBlock);
      placeCaretAtEnd(formattedBlock);
    } else {
      document.execCommand('formatBlock', false, format);
    }
    updateBlock(id, { text: editor.innerHTML, format });
    requestAnimationFrame(() => rememberEditorSelection(id));
  };

  const insertSpecialCharacter = (character) => {
    runEditorCommand('insertText', character);
    setShowSpecialCharacters(false);
  };

  const updateBlock = (id, data) => updateBlocks(blocks.map((block) => (
    block.id === id ? { ...block, data: { ...block.data, ...data } } : block
  )));

  const removeBlock = (id) => {
    const nextBlocks = blocks.filter((block) => block.id !== id);
    updateBlocks(nextBlocks.length > 0 ? nextBlocks : [createBlock()]);
  };

  const handleBlockImage = (event, id) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateBlock(id, { url: reader.result, caption: file.name });
    reader.readAsDataURL(file);
  };

  const savePost = (redirectTarget = '/account', status = 'published') => {
    try {
      const currentPosts = Array.isArray(user?.posts) ? user.posts : [];
      const allPosts = JSON.parse(localStorage.getItem('testsite-posts') || '[]');
      const normalizedTags = form.tags
        ? form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

      const imageValue = form.image || '';
      const authorName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.username || 'Author';
      const authorId = user?.email || user?.username || `guest-${Date.now()}`;
      const postData = {
        title: form.title || 'Untitled',
        slug: form.slug || `post-${Date.now()}`,
        category: form.category,
        status,
        tags: normalizedTags,
        image: imageValue,
        featuredImage: imageValue,
        content: form.content,
        date: new Date().toLocaleDateString(),
        author: authorName,
        authorId: authorId,
        authorAvatar: user?.profile_photo || (user?.email ? localStorage.getItem(`testsite-profile-${user.email.toLowerCase()}`) : ''),
        authorBio: user?.bio || '',
        authorSocial: user?.social || {}
      };

      if (status === 'draft') {
        const draftKey = `testsite-drafts-${String(user?.email || user?.username || 'anonymous').toLowerCase()}`;
        const savedDrafts = JSON.parse(localStorage.getItem(draftKey) || '[]');
        const draft = { id: isEdit && id ? Number(id) : Date.now(), ...postData, status: 'draft' };
        const nextDrafts = [draft, ...savedDrafts.filter((savedDraft) => String(savedDraft.id) !== String(draft.id))];
        localStorage.setItem(draftKey, JSON.stringify(nextDrafts));

        if (isEdit && id) {
          localStorage.setItem('testsite-posts', JSON.stringify(allPosts.filter((post) => String(post.id) !== String(id))));
          updateProfile({ posts: currentPosts.filter((post) => String(post.id) !== String(id)) });
        }

        navigate(redirectTarget);
        return;
      }

      if (isEdit && id) {
        const updatedGlobalPosts = allPosts.map((post) =>
          String(post.id) === String(id)
            ? { ...post, ...postData, id: post.id }
            : post
        );

        const updatedUserPosts = currentPosts.map((post) =>
          String(post.id) === String(id)
            ? { ...post, ...postData, id: post.id }
            : post
        );

        const savedPosts = updatedGlobalPosts.length > 0 ? updatedGlobalPosts : [{ id: Number(id), ...postData }];

        localStorage.setItem('testsite-posts', JSON.stringify(savedPosts));

        const draftKey = `testsite-drafts-${String(user?.email || user?.username || 'anonymous').toLowerCase()}`;
        const savedDrafts = JSON.parse(localStorage.getItem(draftKey) || '[]');
        localStorage.setItem(draftKey, JSON.stringify(savedDrafts.filter((draft) => String(draft.id) !== String(id))));

        if (updateProfile) {
          updateProfile({ posts: updatedUserPosts.length > 0 ? updatedUserPosts : [{ id: Number(id), ...postData }] });
        }

        navigate(redirectTarget);
        return;
      }

      const newPost = {
        id: Date.now(),
        ...postData
      };

      const savedPosts = [newPost, ...allPosts];
      const savedUserPosts = [newPost, ...currentPosts];
      localStorage.setItem('testsite-posts', JSON.stringify(savedPosts));

      if (updateProfile) {
        updateProfile({ posts: savedUserPosts });
      }

      navigate(redirectTarget);
    } catch (err) {
      console.error('Failed to save post locally', err);
      alert('Unable to save post. Check console for details.');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isDirty) {
      setPendingAction(isEdit ? 'save' : 'publish');
      setPendingNavigation('/account');
      setShowConfirm(true);
      return;
    }

    setIsDirty(false);
    setShowConfirm(false);
    setPendingAction(null);
    savePost('/account');
  };

  const handleSaveDraft = () => {
    setIsDirty(false);
    setShowConfirm(false);
    setPendingAction(null);
    savePost('/account', 'draft');
  };

  const handleMoveToTrash = () => {
    const allPosts = JSON.parse(localStorage.getItem('testsite-posts') || '[]');
    localStorage.setItem('testsite-posts', JSON.stringify(allPosts.filter((post) => String(post.id) !== String(id))));
    updateProfile({ posts: (user.posts || []).filter((post) => String(post.id) !== String(id)) });
    navigate('/account');
  };

  const handlePreview = () => {
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) return;
    const title = String(form.title || 'Untitled')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const content = blocks.map((block) => {
      if (block.type === 'image' && block.data?.url) {
        return `<figure><img src="${block.data.url}" alt="${block.data.caption || 'Post image'}"><figcaption>${block.data.caption || ''}</figcaption></figure>`;
      }

      const editor = editorRefs.current[block.id];
      return editor?.innerHTML || block.data?.text || '';
    }).join('<p><br></p>');

    previewWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>
      body{max-width:860px;margin:0 auto;padding:48px 24px;color:#334155;font:16px/1.75 system-ui,sans-serif}
      h1{color:#0f172a;line-height:1.2} h2,h3,h4,h5,h6{margin:1.5rem 0 .75rem;color:#0f172a;line-height:1.3}
      p{margin:1rem 0;font-size:1rem;line-height:1.75} img{max-width:100%;height:auto} figure{margin:2rem 0} figcaption{color:#64748b;font-size:.875rem;text-align:center}
      blockquote{border-left:4px solid #334155;margin:1.5rem 0;padding-left:1rem;color:#475569;font-style:italic}
      ul{list-style-type:disc;padding-left:2rem} ol{list-style-type:decimal;padding-left:2rem} ul,ol,li{font-size:1rem;line-height:1.75}
      [data-read-more="true"], [data-page-break="true"]{display:flex;align-items:center;gap:.75rem;margin:1.5rem 0;color:#94a3b8;font-size:.7rem;line-height:1;text-align:center;white-space:nowrap}
      [data-read-more="true"]::before,[data-read-more="true"]::after,[data-page-break="true"]::before,[data-page-break="true"]::after{flex:1;border-top:2px dashed #cbd5e1;content:''}
    </style></head><body><h1>${title}</h1><main>${content}</main></body></html>`);
    previewWindow.document.close();
  };

  const handleLeave = (target = '/account') => {
    if (isDirty) {
      setPendingNavigation(target);
      setPendingAction(isEdit ? 'save' : 'publish');
      setShowConfirm(true);
    } else {
      navigate(target);
    }
  };

  const confirmLeave = (action) => {
    if (action === 'discard') {
      setIsDirty(false);
      setShowConfirm(false);
      setPendingNavigation(null);
      setPendingAction(null);
      navigate('/account');
      return;
    }

    setIsDirty(false);
    setShowConfirm(false);
    setPendingNavigation(null);
    setPendingAction(null);
    savePost('/account');
  };

  const confirmPrimaryLabel = isEdit ? 'Save' : 'Publish';
  const confirmMessage = isEdit
    ? 'You have unsaved changes. Save or discard before leaving.'
    : 'You have unsaved changes. Publish or discard before leaving.';

  if (!user || !user.confirmed) {
    if (user && !user.confirmed) return null;
    return (
      <>
        <PageHeader title="Create Post" subtitle="Please log in to manage blog posts." />
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white p-10 shadow-xl text-center">
            <h2 className="text-2xl font-semibold text-slate-900">Confirmation required</h2>
            <p className="mt-4 text-slate-600">Please confirm your account before creating or editing blog posts.</p>
            {!user && <button type="button" onClick={() => navigate('/login')} className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700">Go to Login</button>}
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader title={isEdit ? 'Edit Post' : 'Create Post'} subtitle={isEdit ? 'Update your blog content.' : 'Write a new blog post.'} />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-12">
          {/* Left column: title + editor */}
          <div className="lg:col-span-8">
            <div className="mb-6">
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Add title"
                className="w-full rounded-none border border-slate-400 bg-white px-2 py-1 text-xl leading-tight text-slate-900 placeholder-slate-500 outline-none transition hover:border-[#22C55E] focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]"
              />
            </div>

            <div className="mb-6">
              <div className="space-y-4">
                {blocks.map((block, index) => (
                  <div key={block.id} onClick={(event) => selectEditorImage(block.id, event)} className="group relative min-w-0 text-left">
                    <div className="absolute right-4 top-4 hidden gap-1 rounded bg-white shadow-sm group-hover:flex">
                      <button type="button" onClick={() => removeBlock(block.id)} className="px-2 py-1 text-xs text-slate-400 hover:text-red-600" aria-label={`Remove block ${index + 1}`}>×</button>
                    </div>
                    {block.type === 'image' ? (
                      <div>
                        {block.data.url ? <img src={block.data.url} alt={block.data.caption || 'Post block'} className="max-h-96 w-full object-cover" /> : <div className="flex h-40 items-center justify-center border-2 border-dashed border-slate-200 text-sm text-slate-400">Choose an image below</div>}
                        <input type="file" accept="image/*" onChange={(event) => handleBlockImage(event, block.id)} className="mt-3 w-full text-sm text-slate-500" />
                        <input value={block.data.caption || ''} onChange={(event) => updateBlock(block.id, { caption: event.target.value })} placeholder="Image caption (optional)" className="mt-2 w-full border-0 px-0 text-sm text-slate-500 outline-none focus:ring-0" />
                      </div>
                    ) : (
                      <>
                        <div data-color-dropdown className="sticky top-[10rem] z-[5] mb-3 border border-slate-300 bg-slate-50 transition hover:border-[#22C55E]">
                          <div className="flex flex-wrap items-center gap-1 p-1">
                          <select
                            value={block.data.format || 'p'}
                            onChange={(event) => handleFormatChange(block.id, event.target.value)}
                            onMouseDown={() => { setActiveEditorId(block.id); rememberEditorSelection(block.id); }}
                            title="Text format"
                            aria-label="Text format"
                            className="h-7 border-r border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-500"
                          >
                            {formatOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                          </select>
                          {basicToolbar.map(([command, label, title, value]) => (
                            <button key={command} type="button" title={title} aria-label={title} onMouseDown={(event) => event.preventDefault()} onClick={() => command === 'insertReadMore' ? runEditorCommand('insertReadMore', null, block.id) : runEditorCommand(command, value, block.id)} className={`flex h-8 min-w-8 items-center justify-center px-1 text-base hover:bg-white hover:text-[#22C55E] ${activeCommands[command] ? 'bg-slate-300 text-slate-900' : 'text-slate-600'}`}>
                              <i className={label} aria-hidden="true" />
                            </button>
                          ))}
                          <button type="button" title="Add Media" aria-label="Add Media" onMouseDown={(event) => { event.preventDefault(); setActiveEditorId(block.id); rememberEditorSelection(block.id); }} onClick={() => { setMediaTab('upload'); setShowMediaUrlInput(false); setShowMediaModal(true); }} className="flex h-8 min-w-8 items-center justify-center px-1 text-base text-slate-600 hover:bg-white hover:text-[#22C55E]"><i className="fa-solid fa-images" aria-hidden="true" /></button>
                          <button type="button" title="Extended toolbar" aria-label="Extended toolbar" onClick={() => setIsExtendedToolbarOpen((current) => !current)} className={`flex h-7 min-w-8 items-center justify-center px-1 text-sm ${isExtendedToolbarOpen ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'text-slate-600 hover:bg-white hover:text-[#22C55E]'}`}><i className="fa-solid fa-sliders" aria-hidden="true" /></button>
                          </div>
                          {isExtendedToolbarOpen && (
                            <div className="flex flex-wrap items-center gap-1 border-t border-slate-300 p-1">
                              {extendedToolbarItems.map(([command, label, title]) => (
                                <button key={command} type="button" title={title} aria-label={title} onMouseDown={(event) => event.preventDefault()} onClick={() => command === 'specialCharacter' ? (setActiveEditorId(block.id), setShowSpecialCharacters(true)) : runEditorCommand(command, null, block.id)} className="flex h-8 min-w-8 items-center justify-center px-1 text-base text-slate-600 hover:bg-white hover:text-[#22C55E]">
                                  {command === 'specialCharacter' ? <span className="font-serif text-lg leading-none" aria-hidden="true">Ω</span> : <i className={label} aria-hidden="true" />}
                                  {command === 'foreColor' && <span className="ml-0.5 text-xs leading-5">▾</span>}
                                </button>
                              ))}
                              <button type="button" title="Keyboard shortcuts" aria-label="Keyboard shortcuts" onClick={() => setShowKeyboardShortcuts(true)} className="flex h-8 min-w-8 items-center justify-center px-1 text-base text-slate-600 hover:bg-white hover:text-[#22C55E]">
                                <i className="fa-solid fa-circle-question" aria-hidden="true" />
                              </button>
                            </div>
                          )}
                          {colorEditorId === block.id && (
                            <div data-color-dropdown className="absolute left-5 top-full z-50 w-fit border border-slate-300 bg-white p-2 shadow-md">
                              <div className="grid w-44 grid-cols-6 gap-1">
                                {textColors.map((color) => (
                                  <button key={color} type="button" title={`Use ${color}`} aria-label={`Use ${color}`} onClick={() => applyTextColor(color)} className="h-5 w-5 border border-slate-300" style={{ backgroundColor: color }} />
                                ))}
                              </div>
                              <button type="button" onClick={() => { setCustomColor('#000000'); setShowCustomColor(true); }} className="mt-2 text-xs text-slate-700 hover:text-indigo-600">Custom...</button>
                            </div>
                          )}
                        </div>
                        <div
                          ref={(element) => { editorRefs.current[block.id] = element; }}
                          contentEditable
                          dir="ltr"
                          suppressContentEditableWarning
                          onFocus={() => { setActiveEditorId(block.id); rememberEditorSelection(block.id); }}
                          onClick={(event) => {
                            if (handleExistingLinkClick(block.id, event)) return;
                            if (event.target.closest('a')) event.preventDefault();
                            selectEditorImage(block.id, event);
                            rememberEditorSelection(block.id);
                          }}
                          onKeyUp={refreshActiveCommands}
                          onMouseUp={(event) => {
                            refreshActiveCommands();
                            if (event.target.tagName === 'IMG') updateBlock(block.id, { text: event.currentTarget.innerHTML });
                          }}
                          onKeyDown={(event) => handleEditorKeyDown(block.id, event)}
                          onPaste={(event) => handleEditorPaste(block.id, event)}
                          onInput={(event) => handleEditorInput(block.id, event)}
                          data-placeholder={block.type === 'header' ? 'Write a subtitle...' : block.type === 'quote' ? 'Write a quotation...' : block.type === 'list' ? 'Write a list...' : 'Write your story...'}
                          className={`post-editor-content block min-h-32 min-w-0 w-full max-w-full resize-y overflow-x-hidden overflow-y-auto break-words whitespace-pre-wrap border border-slate-200 bg-white p-3 text-left text-slate-900 outline-none transition hover:border-[#22C55E] focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E] empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] ${block.type === 'quote' || block.data.format === 'blockquote' ? 'border-l-4 border-slate-700 pl-4 italic' : ''}`}
                          style={{ direction: 'ltr', unicodeBidi: 'plaintext', overflowWrap: 'anywhere' }}
                        />
                        {linkEditor.id === block.id && linkEditorRect && (
                          <div className="fixed z-40 w-[min(100%-1rem,30rem)] border border-[#22C55E]/50 bg-white p-2 shadow-md" style={{ left: linkEditorRect.left, top: linkEditorRect.top }}>
                            <div className="flex items-center gap-2">
                              <input
                                autoFocus
                                value={linkEditor.url}
                                onChange={(event) => setLinkEditor((current) => ({ ...current, url: event.target.value }))}
                                onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); applyLink(); } }}
                                placeholder="Paste URL or type to search"
                                type="url"
                                className="min-w-0 flex-1 border border-[#22C55E] px-2 py-1 text-xs text-slate-800 outline-none"
                                aria-label="Link URL"
                              />
                              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setShowLinkOptions((current) => !current)} className={`border px-2 py-1 text-sm ${showLinkOptions ? 'border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E]' : 'border-slate-300 text-slate-600 hover:border-[#22C55E] hover:text-[#22C55E]'}`} aria-label="Link options" title="Link options"><i className="fa-solid fa-gear" aria-hidden="true" /></button>
                              <button type="button" onClick={applyLink} className="bg-[#22C55E] px-2 py-1 text-sm text-white hover:bg-[#16A34A]" aria-label="Apply link" title="Apply link">↵</button>
                              <button type="button" onClick={() => { setLinkEditor({ id: null, url: '' }); setLinkEditorRect(null); setShowLinkOptions(false); }} className="px-1 text-sm text-slate-500 hover:text-slate-900" aria-label="Cancel link" title="Cancel link">×</button>
                            </div>
                            {showLinkOptions && (
                              <div className="mt-2 border border-slate-300 bg-white p-3 shadow-sm">
                                <div className="mb-2 text-xs font-semibold text-slate-700">Insert/edit link</div>
                                <label className="mb-2 block text-xs text-slate-600">Link Text
                                  <input value={linkOptions.text} onChange={(event) => setLinkOptions((current) => ({ ...current, text: event.target.value }))} className="mt-1 w-full border border-slate-300 px-2 py-1 text-xs text-slate-800 outline-none focus:border-[#22C55E]" aria-label="Link text" />
                                </label>
                                <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={linkOptions.newTab} onChange={(event) => setLinkOptions((current) => ({ ...current, newTab: event.target.checked }))} /> Open link in a new tab</label>
                              </div>
                            )}
                            <div className="mt-2 text-[11px] text-slate-500">Select text first to insert a link, or click an existing link to edit it.</div>
                          </div>
                        )}
                        {linkActions?.blockId === block.id && (
                          <div data-link-actions className="fixed z-40 flex items-center gap-1 border border-slate-300 bg-white p-1 shadow-md" onClick={(event) => event.stopPropagation()} style={{ left: Math.max(8, linkActions.rect.left), top: Math.min(window.innerHeight - 42, linkActions.rect.bottom + 8) }}>
                            <button type="button" onClick={editExistingLink} className="flex h-7 w-7 items-center justify-center text-slate-700 hover:bg-slate-100" title="Edit link" aria-label="Edit link"><i className="fa-solid fa-pencil" aria-hidden="true" /></button>
                            <button type="button" onClick={removeExistingLink} className="flex h-7 w-7 items-center justify-center text-red-600 hover:bg-red-50" title="Remove link" aria-label="Remove link"><i className="fa-solid fa-link-slash" aria-hidden="true" /></button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: sidebar */}
          <aside className="self-start lg:col-span-4">
            <div className="sticky top-28 max-h-[calc(100vh-7rem)] space-y-5 overflow-y-auto pr-1">
              <div className="border border-slate-300 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-300 px-3 py-2">
                  <h3 className="text-sm font-semibold text-slate-800">Publish</h3>
                  <button type="button" onClick={() => setCollapsedPanels((current) => ({ ...current, publish: !current.publish }))} className="flex h-6 w-6 items-center justify-center text-slate-400 hover:text-[#22C55E]" aria-label={`${collapsedPanels.publish ? 'Open' : 'Close'} Publish panel`}>
                    <i className={`fa-solid fa-chevron-${collapsedPanels.publish ? 'down' : 'up'} text-xs`} aria-hidden="true" />
                  </button>
                </div>
                {!collapsedPanels.publish && <>
                <div className="flex justify-between gap-3 px-3 py-3">
                  <button type="button" onClick={handleSaveDraft} className="border border-[#22C55E] px-4 py-2 text-xs text-[#22C55E] hover:bg-emerald-50">Save Draft</button>
                  <button type="button" onClick={handlePreview} className="border border-[#22C55E] px-4 py-2 text-xs text-[#22C55E] hover:bg-emerald-50">Preview</button>
                </div>
                <div className="flex justify-end border-t border-slate-200 px-3 py-3">
                  {isEdit && <button type="button" onClick={handleMoveToTrash} className="mr-auto text-xs text-[#22C55E] underline hover:text-emerald-700">Move to Trash</button>}
                  <button type="button" onClick={handleSubmit} className="bg-[#22C55E] px-5 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-[#1fae58]">{isEdit ? 'Update' : 'Publish'}</button>
                </div>
                </>}
              </div>

              <div className="border border-slate-300 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-300 px-3 py-2">
                  <h3 className="text-sm font-semibold text-slate-800">Categories</h3>
                  <button type="button" onClick={() => setCollapsedPanels((current) => ({ ...current, categories: !current.categories }))} className="flex h-6 w-6 items-center justify-center text-slate-400 hover:text-[#22C55E]" aria-label={`${collapsedPanels.categories ? 'Open' : 'Close'} Categories panel`}>
                    <i className={`fa-solid fa-chevron-${collapsedPanels.categories ? 'down' : 'up'} text-xs`} aria-hidden="true" />
                  </button>
                </div>
                {!collapsedPanels.categories && <>
                <div className="flex border-b border-slate-200 px-3 pt-2 text-xs">
                  <button type="button" onClick={() => setCategoryTab('all')} className={`border border-b-0 px-3 py-2 ${categoryTab === 'all' ? 'bg-white text-slate-700' : 'border-transparent text-[#22C55E]'}`}>All Categories</button>
                  <button type="button" onClick={() => setCategoryTab('used')} className={`border border-b-0 px-3 py-2 ${categoryTab === 'used' ? 'bg-white text-slate-700' : 'border-transparent text-[#22C55E]'}`}>Most Used</button>
                </div>
                <div className="mx-3 my-3 max-h-48 overflow-y-auto border border-slate-200 p-3">
                  {visibleCategories.map((category) => (
                    <label key={category} className="flex items-center gap-2 py-1 text-xs text-slate-700">
                      <input type="checkbox" checked={form.category === category} onChange={() => { setForm((current) => ({ ...current, category })); setIsDirty(true); }} />
                      {category}
                    </label>
                  ))}
                </div>
                <div className="px-3 pb-3">
                  <button type="button" onClick={() => setShowAddCategory((current) => !current)} className="text-xs text-[#22C55E] underline">+ Add Category</button>
                  {showAddCategory && (
                    <div className="mt-3 space-y-2">
                      <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} autoFocus type="text" className="w-full border border-slate-300 px-2 py-2 text-xs outline-none focus:border-[#22C55E]" />
                      <select value={parentCategory} onChange={(event) => setParentCategory(event.target.value)} className="w-full border-2 border-[#22C55E] px-2 py-2 text-xs outline-none">
                        <option value="">— Parent Category —</option>
                        {categoryList.map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                      <button type="button" onClick={handleAddCategory} className="border border-[#22C55E] px-3 py-2 text-xs text-[#22C55E] hover:bg-emerald-50">Add Category</button>
                    </div>
                  )}
                </div>
                </>}
              </div>

              <div className="border border-slate-300 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-300 px-3 py-2">
                  <h3 className="text-sm font-semibold text-slate-800">Tags</h3>
                  <button type="button" onClick={() => setCollapsedPanels((current) => ({ ...current, tags: !current.tags }))} className="flex h-6 w-6 items-center justify-center text-slate-400 hover:text-[#22C55E]" aria-label={`${collapsedPanels.tags ? 'Open' : 'Close'} Tags panel`}>
                    <i className={`fa-solid fa-chevron-${collapsedPanels.tags ? 'down' : 'up'} text-xs`} aria-hidden="true" />
                  </button>
                </div>
                {!collapsedPanels.tags && <>
                <div className="flex items-start gap-2 px-3 py-3">
                  <div className="flex min-h-9 flex-1 flex-wrap items-center gap-1 border border-slate-300 bg-white px-2 py-1 focus-within:border-[#22C55E]">
                    {getTags().map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-2 bg-slate-200 px-2 py-1 text-xs text-slate-700">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag(tag)} className="text-base leading-none text-slate-600 hover:text-red-600" aria-label={`Remove ${tag} tag`}>×</button>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={handleTagInputChange}
                      onKeyDown={handleTagKeyDown}
                      type="text"
                      className="min-w-[6rem] flex-1 border-0 bg-transparent px-1 py-1 text-xs outline-none focus:ring-0"
                      aria-label="Add tag"
                    />
                  </div>
                  <button type="button" onClick={handleAddTag} className="border border-[#22C55E] px-4 py-2 text-xs text-[#22C55E] hover:bg-emerald-50">Add</button>
                </div>
                <div className="px-3 pb-3 text-xs text-slate-500">Separate tags with commas</div>
                </>}
              </div>

              <div className="border border-slate-300 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-300 px-3 py-2">
                  <h3 className="text-sm font-semibold text-slate-800">Featured Image</h3>
                  <button type="button" onClick={() => setCollapsedPanels((current) => ({ ...current, featuredImage: !current.featuredImage }))} className="flex h-6 w-6 items-center justify-center text-slate-400 hover:text-[#22C55E]" aria-label={`${collapsedPanels.featuredImage ? 'Open' : 'Close'} Featured Image panel`}>
                    <i className={`fa-solid fa-chevron-${collapsedPanels.featuredImage ? 'down' : 'up'} text-xs`} aria-hidden="true" />
                  </button>
                </div>
                {!collapsedPanels.featuredImage && <>
                <div className="p-3">
                  <label className="block cursor-pointer border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-[#22C55E]">
                    {form.image ? (
                      <img src={form.image} alt="Featured preview" className="h-36 w-full object-cover" />
                    ) : (
                      <div className="px-3 py-8 text-xs text-slate-500">Set featured image</div>
                    )}
                    <input name="image" type="file" accept="image/*" onChange={handleChange} className="sr-only" />
                  </label>
                  {form.image && (
                    <button type="button" onClick={() => { setForm((current) => ({ ...current, image: null })); setIsDirty(true); }} className="mt-2 text-xs text-red-600 underline hover:text-red-700">Remove featured image</button>
                  )}
                </div>
                </>}
              </div>
            </div>
          </aside>
        </form>
      </section>

      {selectedImage && imageOverlayRect && (
        <div
          className="pointer-events-none fixed z-[5] border border-sky-500"
          style={{ left: imageOverlayRect.left, top: imageOverlayRect.top, width: imageOverlayRect.width, height: imageOverlayRect.height }}
        >
          <div className="pointer-events-auto absolute -top-9 left-1/2 flex -translate-x-1/2 items-center gap-1 border border-slate-300 bg-white p-1 shadow-sm">
            {[
              ['left', 'fa-align-left', 'Align left'],
              ['center', 'fa-align-center', 'Align center'],
              ['right', 'fa-align-right', 'Align right'],
              ['none', 'fa-ban', 'No alignment']
            ].map(([value, icon, label]) => (
              <button key={value} type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={(event) => { event.stopPropagation(); alignSelectedImage(value); }} className={`flex h-7 w-7 items-center justify-center text-slate-700 hover:bg-slate-100 ${imageDetails.align === value ? 'bg-slate-200' : ''}`}><i className={`fa-solid ${icon}`} aria-hidden="true" /></button>
            ))}
            <button type="button" title="Edit image" aria-label="Edit image" onClick={openImageDetails} className="flex h-7 w-7 items-center justify-center text-slate-700 hover:bg-slate-100"><i className="fa-solid fa-pencil" aria-hidden="true" /></button>
            <button type="button" title="Remove image" aria-label="Remove image" onClick={removeSelectedImage} className="flex h-7 w-7 items-center justify-center text-red-600 hover:bg-red-50"><i className="fa-solid fa-xmark" aria-hidden="true" /></button>
          </div>
          {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => {
            const positions = {
              nw: { left: 0, top: 0, cursor: 'nwse-resize' },
              n: { left: '50%', top: 0, cursor: 'ns-resize' },
              ne: { right: 0, top: 0, cursor: 'nesw-resize' },
              e: { right: 0, top: '50%', cursor: 'ew-resize' },
              se: { right: 0, bottom: 0, cursor: 'nwse-resize' },
              s: { left: '50%', bottom: 0, cursor: 'ns-resize' },
              sw: { left: 0, bottom: 0, cursor: 'nesw-resize' },
              w: { left: 0, top: '50%', cursor: 'ew-resize' }
            };
            const position = positions[handle];
            return (
              <span
                key={handle}
                onMouseDown={(event) => startImageResize(event, handle)}
                className="pointer-events-auto absolute h-3 w-3 rounded-full border-2 border-slate-500 bg-white"
                style={{ ...position, transform: `${position.left === '50%' || position.right === '50%' ? 'translateX(-50%) ' : ''}${position.top === '50%' || position.bottom === '50%' ? 'translateY(-50%)' : ''}` }}
              />
            );
          })}
        </div>
      )}

      {showImageDetails && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4" onClick={() => setShowImageDetails(false)}>
          <div className="w-full max-w-4xl border border-slate-300 bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-300 px-4 py-2">
              <h3 className="text-xl font-semibold text-slate-800">Image details</h3>
              <button type="button" onClick={() => setShowImageDetails(false)} className="text-xl text-slate-500 hover:text-slate-900" aria-label="Close image details">×</button>
            </div>
            <div className="grid gap-6 p-5 md:grid-cols-2">
              <div className="space-y-4">
                <label className="grid grid-cols-[7rem_1fr] items-start gap-3 text-sm text-slate-600">
                  <span className="pt-2 text-right">Alternative Text</span>
                  <textarea value={imageDetails.alt} onChange={(event) => setImageDetails((current) => ({ ...current, alt: event.target.value }))} className="h-20 border border-slate-300 px-2 py-2 outline-none focus:border-indigo-500" />
                </label>
                <label className="grid grid-cols-[7rem_1fr] items-start gap-3 text-sm text-slate-600">
                  <span className="pt-2 text-right">Caption</span>
                  <textarea value={imageDetails.caption} onChange={(event) => setImageDetails((current) => ({ ...current, caption: event.target.value }))} className="h-16 border border-slate-300 px-2 py-2 outline-none focus:border-indigo-500" />
                </label>
                <hr className="border-slate-200" />
                <div className="text-xs font-semibold uppercase text-slate-600">Display Settings</div>
                <div className="grid grid-cols-[7rem_1fr] items-center gap-3 text-sm text-slate-600">
                  <span className="text-right">Align</span>
                  <div className="flex">
                    {['left', 'center', 'right', 'none'].map((value) => <button key={value} type="button" onClick={() => setImageDetails((current) => ({ ...current, align: value }))} className={`border border-indigo-400 px-3 py-2 text-xs capitalize ${imageDetails.align === value ? 'bg-indigo-50 text-indigo-700' : 'text-indigo-600'}`}>{value}</button>)}
                  </div>
                </div>
                <label className="grid grid-cols-[7rem_1fr] items-center gap-3 text-sm text-slate-600">
                  <span className="text-right">Size</span>
                  <select value={imageDetails.size} onChange={(event) => { const size = event.target.value; const dimensions = { thumbnail: [150, 150], medium: [300, 300], full: [512, 512] }[size]; setImageDetails((current) => ({ ...current, size, ...(dimensions ? { width: dimensions[0], height: dimensions[1] } : {}) })); }} className="border border-slate-300 px-2 py-2 outline-none focus:border-indigo-500">
                    <option value="thumbnail">Thumbnail - 150 x 150</option><option value="medium">Medium - 300 x 300</option><option value="full">Full Size - 512 x 512</option><option value="custom">Custom Size</option>
                  </select>
                </label>
                <div className="grid grid-cols-[7rem_1fr] items-center gap-3 text-sm text-slate-600"><span className="text-right">Width / Height</span><div className="flex items-center gap-2"><input type="number" value={imageDetails.width} onChange={(event) => setImageDetails((current) => ({ ...current, width: event.target.value }))} className="w-24 border border-slate-300 px-2 py-2" /><span>×</span><input type="number" value={imageDetails.height} onChange={(event) => setImageDetails((current) => ({ ...current, height: event.target.value }))} className="w-24 border border-slate-300 px-2 py-2" /></div></div>
                <label className="grid grid-cols-[7rem_1fr] items-center gap-3 text-sm text-slate-600"><span className="text-right">Link To</span><select value={imageDetails.link} onChange={(event) => setImageDetails((current) => ({ ...current, link: event.target.value }))} className="border border-slate-300 px-2 py-2"><option value="none">None</option><option value="custom">Custom URL</option></select></label>
                {imageDetails.link === 'custom' && <div className="grid grid-cols-[7rem_1fr] items-center gap-3 text-sm text-slate-600"><span className="text-right">URL</span><input autoFocus value={imageLinkUrl} onChange={(event) => setImageLinkUrl(event.target.value)} placeholder="https://example.com" type="url" className="border border-indigo-500 px-2 py-2 outline-none" /></div>}
              </div>
              <div className="flex items-center justify-center bg-slate-50 p-5"><img src={selectedImage.element.src} alt={imageDetails.alt} style={{ width: imageDetails.width ? `${imageDetails.width}px` : 'auto', height: imageDetails.height ? `${imageDetails.height}px` : 'auto', maxWidth: '100%' }} /></div>
            </div>
            <div className="flex justify-end border-t border-slate-200 px-5 py-3"><button type="button" onClick={updateImageDetails} className="bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Update</button></div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900">Unsaved Changes</h3>
            <p className="mt-4 text-slate-600">{confirmMessage}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => confirmLeave('discard')} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Discard
              </button>
              <button onClick={() => confirmLeave('save')} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
                {confirmPrimaryLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {showKeyboardShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4" onClick={() => setShowKeyboardShortcuts(false)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto border border-slate-300 bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-300 px-4 py-3">
              <h3 className="text-base font-semibold text-slate-800">Keyboard shortcuts</h3>
              <button type="button" onClick={() => setShowKeyboardShortcuts(false)} className="text-lg text-slate-500 hover:text-slate-900" aria-label="Close keyboard shortcuts dialog">×</button>
            </div>
            <div className="space-y-6 p-4">
              {keyboardShortcutGroups.map((group) => (
                <section key={group.title}>
                  <h4 className="mb-3 text-sm font-semibold text-slate-700">{group.title}</h4>
                  <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                    {group.shortcuts.map(([shortcut, action]) => (
                      <div key={`${shortcut}-${action}`} className="flex items-center gap-3 text-sm text-slate-600">
                        <kbd className="min-w-16 border border-slate-200 bg-slate-100 px-2 py-1 text-center text-xs font-semibold text-slate-700">{shortcut}</kbd>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="flex justify-end border-t border-slate-200 px-4 py-2">
              <button type="button" onClick={() => setShowKeyboardShortcuts(false)} className="border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {showSpecialCharacters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4" onClick={() => setShowSpecialCharacters(false)}>
          <div className="w-full max-w-xl border border-slate-300 bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-300 px-4 py-2">
              <h3 className="text-sm font-semibold text-slate-800">Special character</h3>
              <button type="button" onClick={() => setShowSpecialCharacters(false)} className="text-lg text-slate-500 hover:text-slate-900" aria-label="Close special character dialog">×</button>
            </div>
            <div className="grid grid-cols-8 gap-px bg-slate-200 p-px sm:grid-cols-12">
              {specialCharacters.map((character) => (
                <button key={character} type="button" onClick={() => insertSpecialCharacter(character)} className="flex h-9 items-center justify-center bg-white text-base text-slate-700 hover:bg-indigo-50 hover:text-indigo-700">{character}</button>
              ))}
            </div>
            <div className="flex justify-end border-t border-slate-200 px-4 py-2">
              <button type="button" onClick={() => setShowSpecialCharacters(false)} className="border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {showMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4" onClick={() => setShowMediaModal(false)}>
          <div className="w-full max-w-4xl border border-slate-300 bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-300">
              <div className="flex items-center">
                <button type="button" onClick={() => setMediaTab('upload')} className={`border-r border-slate-300 px-3 py-2 text-sm ${mediaTab === 'upload' ? 'border-b-2 border-[#22C55E] text-[#22C55E]' : 'text-slate-700'}`}>Upload files</button>
                <button type="button" onClick={() => setMediaTab('library')} className={`px-3 py-2 text-sm ${mediaTab === 'library' ? 'border-b-2 border-[#22C55E] text-[#22C55E]' : 'text-slate-700'}`}>Media Library</button>
              </div>
              <button type="button" onClick={() => setShowMediaModal(false)} className="px-4 text-xl text-slate-500 hover:text-slate-900" aria-label="Close media dialog">×</button>
            </div>

            {mediaTab === 'upload' ? (
              <div className="flex min-h-[28rem] flex-col items-center justify-center px-4 py-10 text-center">
                <div className="text-xl text-slate-800">Drop files to upload</div>
                <div className="my-2 text-sm text-slate-500">or</div>
                <button type="button" onClick={() => mediaFileInputRef.current?.click()} className="border border-[#22C55E] px-9 py-3 text-sm font-semibold text-[#22C55E] hover:bg-[#22C55E]/10">Select Files</button>
                <input ref={mediaFileInputRef} type="file" accept="image/*" onChange={handleMediaFile} className="hidden" />
                <button type="button" onClick={() => setShowMediaUrlInput((current) => !current)} className="mt-3 text-sm text-[#22C55E] underline">Upload from URL</button>
                {showMediaUrlInput && (
                  <div className="mt-4 flex w-full max-w-md gap-2">
                    <input autoFocus value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') insertMedia(mediaUrl.trim()); }} placeholder="Enter media URL" type="url" className="min-w-0 flex-1 border-2 border-[#22C55E] px-3 py-2 text-sm outline-none" aria-label="Media URL" />
                    <button type="button" onClick={() => insertMedia(mediaUrl.trim())} disabled={!mediaUrl.trim()} className="bg-[#22C55E] px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Upload</button>
                  </div>
                )}
                <p className="mt-4 text-xs text-slate-400">Allowed file types: jpg, jpeg, png, gif, webp.</p>
              </div>
            ) : (
              <div className="flex min-h-[28rem] items-center justify-center p-8 text-sm text-slate-500">No media uploaded yet.</div>
            )}

            <div className="flex justify-end border-t border-slate-200 px-4 py-2">
              <button type="button" onClick={() => setShowMediaModal(false)} className="border border-slate-300 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showCustomColor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4" onClick={() => setShowCustomColor(false)}>
          <div className="w-full max-w-sm border border-slate-300 bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-300 px-4 py-2">
              <h3 className="text-sm font-semibold text-slate-800">Color</h3>
              <button type="button" onClick={() => setShowCustomColor(false)} className="text-lg text-slate-500 hover:text-slate-900" aria-label="Close color dialog">×</button>
            </div>
            <div className="space-y-3 p-4">
              <input type="color" value={customColor} onChange={(event) => setCustomColor(event.target.value)} className="h-36 w-full cursor-pointer" aria-label="Choose custom color" />
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <label htmlFor="custom-hex">#</label>
                <input id="custom-hex" value={customColor.replace('#', '')} onChange={(event) => setCustomColor(`#${event.target.value.replace(/[^0-9a-f]/gi, '').slice(0, 6)}`)} className="min-w-0 flex-1 border border-slate-300 px-2 py-1 outline-none focus:border-indigo-500" maxLength="6" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-2">
              <button type="button" onClick={() => setShowCustomColor(false)} className="border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={() => applyTextColor(customColor)} className="bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700">OK</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostEditor;
