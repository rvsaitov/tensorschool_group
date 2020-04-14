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

class ProfileInfoPersonModel extends Model {
    relationStr = [["Не женат", "Есть подруга", "Влюблен", "Женат", "В гражданском браке", "Все сложно"], ["Не замужем", "Есть друг", "Влюблена", "Замужем", "В гражданском браке", "Все сложно"]];

    getRelationStr() {
        if (this.gender >= 1 && this.relation >= 1) {
            return this.relationStr[this.gender - 1][this.relation - 1];
        }
        return '';
    }

    getAge() {
        return Math.floor((new Date().getTime() - new Date(this.bdate)) / (24 * 3600 * 365.25 * 1000));
    }

    getBdStr() {
        const datetime = new Date(this.bdate);
        const options = {
            month: "long",
            day: "numeric",
        };

        return datetime.toLocaleString("ru", options) + ", " + this.getAge() + " лет";
    }

    getSexStr() {
        if (this.gender == 1) {
            return "Мужской";
        } else if (this.gender == 2) {
            return "Женский";
        }
        return '';
    }

    getCityCountryStr() {
        if (this.country == null || this.country == '')
            return (this.city || '');
        else
            return (this.city || '') + ", " + (this.country);
    }
}