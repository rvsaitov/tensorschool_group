class Component {
    constructor(options) {
        this.options = { ...this.getDefaultOptions(), ...options };
        this.state = {
            isMount: false
        };
        // только для связи с DOM-ом
        this.id = this.generateId();

        // Компоновщик для сбора дерева детей
        this.childrens = factory.create(Composite, { parent: this });

        // для сбора подписок на события и автоматической отписки
        this.handlers = {};
    }


    /**
     * помещает верстку компонента в dom
     * @param {DOMElement} container контейнер в котором строиться верстка, куда поместить
     * @param {String} position insertAdjacentElement позиция куда помесить, до, в, вконец, после
     */
    mount(container, position) {
        // прехук до монтирования        
        this._beforeMount();
        // создаем новый компонент в доме
        const newComponent = document.createElement('div');
        // помещаем туда верстку
        newComponent.innerHTML = this.toString();
        // перекладываем верстку в нужный контейнер
        container.insertAdjacentElement(position || 'beforeend', newComponent.firstElementChild);
        // подчищаем за собой
        newComponent.remove();
        // меняем состояние что компонент смонтирован
        this.setState({ isMount: true });
        // прехук после монтирования
        this._afterMount()
    }

    /**
     * вызываеться при необходимости обновить компонент в верстке
     * пока не реализован, обновляться будет по изменению состояния компонента
     */
    update() {
        this.beforeUpdate();
        this.afterUpdate();
    }

    /**
     * Уничтожения компонента из dom и вообще
     */
    unmount() {
        // выполняем прехуки
        this.beforeUnmount();
        // отписываемся от всех событий
        this.unsubscribeAll();
        // уничтожаем собственный контейнер
        if (this.getContainer()) {
            this.getContainer().remove();
        }
        // уничтожаем детей
        this.unmountChildren()
        // и себя у родителя, если он есть
        if (this.options.parent) {
            this.options.parent.childrens.remove(this.id);
        }
        // прехук после уничтожения
        this.afterUnmount();
    }

    // изменение состояния
    setState(newState) {
        this.state = { ...this.state, ...newState };
    }

    // прехук до монтирования
    beforeMount() {

    }

    // внутренний прехук до монтирования для передачи задач по цепочки и реализации в базе
    _beforeMount() {
        this.beforeMount();
        this._beforeMountChildren();
    }

    // внутренний прехук для вызова прехуков детей
    _beforeMountChildren() {
        for (let ch in this.childrens.childrens) {
            this.childrens.childrens[ch]._beforeMount();
        }
    }

    // прехук после монтирования
    afterMount() {

    }

    // внутренний прехук для вызова прехуков детей
    _afterMount() {
        this.afterMount();
        this._afterMountChildren();
    }

    _afterMountChildren() {
        for (let ch in this.childrens.childrens) {
            this.childrens.childrens[ch]._afterMount();
        }
    }

    // прехук до обновления
    beforeUpdate() {

    }

    // прехук после обновления
    afterUpdate() {

    }

    // прехук до размонтирования
    beforeUnmount() {

    }

    // прехук после размонтирования
    afterUnmount() {

    }

    // размонтирование детей по цепочке вниз
    unmountChildren() {
        for (let ch in this.childrens.childrens) {
            this.childrens.childrens[ch].unmount();
        }
    }

    // получение контейнера из дома куда смонтирован компонент
    getContainer() {
        if (this.container === undefined) {
            this.container = document.getElementById(this.id);
        }
        return this.container;
    }

    // прехук для получения дефолтных опций компонента, реализуется при наследовании
    getDefaultOptions() {
        return {};
    }

    // view компонента, обязательно должен содержать контейнер!!!
    render() {
        return `<div></div>`;
    }

    // текстовое представление компонента, по сути его рендер
    toString() {
        // если не смонтирован, вызовим прехук
        if (!this.state.isMount) {
            this.beforeMount();
            this.setState({ isMount: true });;
        }
        let template = this.render(this.options, this.state);
        const regexp = /<(([a-z]+)\s*([^>]*))>/m;
        // ищем контейнер компонента в верстке и доставляем ему id
        return template.replace(regexp, `<$1 id="${this.id}">`);
    }

    // поиск компонента среди детей по его id
    getById(id) {
        // сначала в своих
        let child = this.childrens.get(id);

        if (child) {
            return child;
        }

        // затем в детях детей по цепочке
        for (let ch in this.childrens.childrens) {
            child = this.childrens.childrens[ch].getById(id);
            if (child) {
                return child;
            }
        }
    }

    // добавление ребенка в компонент и его монтирование
    appendChildren(component, options, container) {
        const child = factory.create(component, { parent: this, ...options });
        this.childrens.add(child);
        child.mount(container || this.getContainer());
    }

    // прдписка любого компонента или его части на событие для его автоматической отписки при уничтожении исходного компонента
    subscribeTo(target, eventName, handler) {
        const handlers = this.handlers[eventName] || [];
        // положим источник и обработчик в список события
        handlers.push({
            target,
            handler
        });
        this.handlers[eventName] = handlers;
        // подпишимся
        target.addEventListener(eventName, handler);
    }

    // отписаться от всех событий
    unsubscribeAll() {
        for (let eventName in this.handlers) {
            this.unsubscribeByEvent(eventName);
        }
    }

    // отписать всех от определенного события
    unsubscribeByEvent(eventName) {
        this.handlers[eventName].forEach(element => {
            element.target.removeEventListener(eventName, element.handler);
        });
    }
}

    Component.prototype.generateId = function () {
    return Math.random().toString(32).slice(2);
};


/**
 * Компоновщик — это структурный паттерн проектирования, который позволяет сгруппировать множество объектов в древовидную структуру, 
 * а затем работать с ней так, как будто это единичный объект.
 * https://refactoring.guru/ru/design-patterns/composite
 */
class Composite {
    constructor(options) {
        options = options || {};
        this.childrens = {}
        this.parent = options.parent;
    }

    create(childControl, options) {
        // Создать и добавить компонент в список дочерних.
        options = (options || {})
        options.parent = this.parent;
        const child = factory.create(childControl, options);
        return this.add(child);
    }

    add(child) {
        // Добавить компонент в список дочерних.
        this.childrens[child.id] = child;
        return child;
    }

    remove(id) {
        // Убрать компонент из списка дочерних.
        delete this.childrens[id];
    }

    get(id) {
        /// получить компонент
        let child = this.childrens[id];
        return child;
    }
}

/**
 * Модели обеспечивают доступ к данным и поведению объектов предметной области (сущностям).
 * Такими сущностями могут быть, например, товары, пользователи, документы — и другие предметы окружающего мира, 
 * которые вы моделируете в своем приложении.
 * 
 * Базовая модель
 */
class Model {
    constructor(data) {
        for (let k in data) {
            this[k] = data[k];
        }
    }
}

class AbstractFactory {
    create(component, options) {
        return new component(options || {});
    }
}

const factory = new AbstractFactory()