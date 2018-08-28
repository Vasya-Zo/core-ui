//@flow
import DropzoneView from './DropzoneView';

const classes = {
    DROPZONE_ACTIVE: 'dev-vertical-dropzone-active',
    DROPZONE_HOVER: 'dev-vertical-dropzone-hover'
};

export default DropzoneView.extend({
    className() {
        return `js-vertical-dropzone dev-vertical-dropzone dev-vertical-dropzone-${this.options.prefix}`;
    },

    getDistance(position) {
        const elPosition = this.el.offset();

        if (position.y < elPosition.top || position.y > elPosition.top + this.el.offsetHeight) {
            return Number.MAX_VALUE;
        }

        return Math.abs(position.x - (elPosition.left + this.el.offsetWidth / 2));
    },

    activate() {
        this.el.classList.add(classes.DROPZONE_ACTIVE);
    },

    deactivate() {
        this.el.classList.remove(classes.DROPZONE_ACTIVE);
    },

    enter() {
        this.el.classList.add(classes.DROPZONE_HOVER);
    },

    leave() {
        this.el.classList.remove(classes.DROPZONE_HOVER);
    }
});
