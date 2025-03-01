
/**
 * Интерактивный поиск
 */
class Search {
    // static busy = false;
    static searchWrap = document.querySelector('.search-wrap');
    static searchInput = document.getElementById('searchInput');
    static resultsContainer = document.getElementById('resultsContainer');
    static searchResultsPopup = document.getElementById('searchResultsPopup');
    static spinner = document.querySelector('.spinner');


    /**
     * 
     * @param {*} type //кастомный тип записи
     * @param {*} id // id контейнера в который будем встраивать посты по нажатию кнопки enter
     */

    constructor(type, id) {
        this.type = type;
        this.busy = false;
        this.id = id;

        this.onChange = this.onChange.bind(this);
        this.checkclick = this.checkclick.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.init();
    }

    /**
     * инициализация
     */
    init() {
        this.onChange();
        Search.searchInput.addEventListener('keydown',this.enterClick.bind(this));
    }

    /**
     * слушаем клик по enter 
     * @param {*} event 
     */
    enterClick(event){
        if(event.key != 'Enter'){
            return;
        }
        event.preventDefault();
        if (event.target && event.target.value){
            const query = event.target.value.trim();
            this.startQuery(query, true);
        }
    }

    /**
     * слушаем изменения инпута
     */
    onChange() {
        Search.searchInput.addEventListener('input', this.debounce((e) => {
            const query = e.target.value.trim();
            this.startQuery(query);
            
        }, 500));
    }

    /**
     * отключаем подгрузку постов при скролле.
     * там закинуто отслеживание дата атрибута "занят"
     */
    disableAjaxPostsLoader(){
        const postList = document.getElementById(this.id);
        postList.dataset.busy = 'true';
    }

    /**
     * подготовливаем и отправляем запрос
     * @param {*} query влово для поиска
     * @param {*} flag по умолчанию флаг не используется. нужен для загрузки постов в основной контейнер
     */
    startQuery(query , flag = false){
        this.disableAjaxPostsLoader();
        if (query.length > 1 && this.busy != true) {
            this.busy = true;
            this.activateSpinner();
            this.loadPosts(this.type, query ,flag);
        }
    }

    /**
     * отправка запроса и получение ответа
     * @param {*} postType тип записи
     * @param {*} query слово для поиска
     * @param {*} flag флаг - куда вставляем в строку поиска или в основной контейнер
     */
    loadPosts(postType, query, flag) {
        const postList = document.getElementById(this.id);

        const data = new FormData;
        data.append('action', 'load_search_result');
        data.append('post_type', postType);
        data.append('query', query);
        data.append('flag', flag);

        fetch(admin_ajax.ajax_url, {
            method: 'POST',
            body: data,
        })
            .then(response => response.json())
            .then(data => {
                if(!flag){
                    Search.resultsContainer.innerHTML = ''; // Очищаем контейнер
                    if (data == '') {
                        Search.resultsContainer.insertAdjacentText('beforeend', 'Nothing to show...');
                    }else{
                        Search.resultsContainer.insertAdjacentHTML('beforeend', data.data);
                        this.activeModal();
                        this.checkclick();
                    }
                }else if(flag && postList){
                    this.unactiveModal();
                    postList.innerHTML = '';
                    postList.insertAdjacentHTML('beforeend', data.data);
                }
            })
            .catch(error => {
                console.error("Ошибка при загрузке записей", error);
            })
            .finally(()=>{
                this.busy =  false;
                this.deactivateSpinner();
            })
    }

    /**
     * активируем модальное окно
     */
    activeModal() {
        Search.searchResultsPopup.classList.add('active');
    }

    /**
     * деактивируем модальное окно
     */
    unactiveModal() {
        Search.searchResultsPopup.classList.remove('active');
        document.removeEventListener('click', this.handleClickOutside);
    }

    /**
     * отслеживаем клики вне области чтоб закрыть модальное окно
     * @param {*} e event
     */
    handleClickOutside(e) {
        if (!Search.searchWrap.contains(e.target)) {
            this.unactiveModal();
        }
    }

    /**
     * вешаем обработчик
     */
    checkclick() {
        document.addEventListener('click', this.handleClickOutside);
    }

    /**
     * активация spinner
     */
    activateSpinner(){
        Search.spinner.style.display = 'inline-block'; 
    }   
      /**
     * деактивация spinner
     */ 
    deactivateSpinner(){
        Search.spinner.style.display = 'none'; 
    }

    /**
     * делаем небольшую задержку
     * @param {*} func 
     * @param {*} delay 
     * @returns 
     */
    debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }
}

const search = new Search('datasets', 'post-list');
