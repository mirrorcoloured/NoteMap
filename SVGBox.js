import { uuidv4 } from "./help_functions.js";

export class SVGBox {
    constructor(container) {
        this.container = container;

        this.register_events();
        this.init();
    }

    init() {
        this.objects = {};

        this.draggingElement = false;
        this.offset = false;
        this.transform = false;
        this.selectedElement = false;
        this.selectfunction = (id) => console.log('selected', id);
        this.deselectfunction = (id) => null;
        this.dragfunction = (id) => null;
        this.enddragfunction = (id) => console.log('ended drag for', id);

        this.storage_option_prefix = "NoteMap_";
        this.storage_object_prefix = "NoteMapSVG_";
        this.zoom = 100;
        this.default_x = 50;
        this.default_y = 50;
        this.default_z = 1;

        this.load();
    }

    register_events() {
        // this.container.addEventListener('click', this.inp_click.bind(this)); // fires inappropriately at unclick time
        this.container.addEventListener('mousedown', this.inp_click.bind(this));
        this.container.addEventListener('touchstart', this.inp_click.bind(this));
        this.container.addEventListener('mousemove', this.drag.bind(this));
        this.container.addEventListener('touchmove', this.drag.bind(this));
        this.container.addEventListener('mouseup', this.endDrag.bind(this));
        this.container.addEventListener('mouseleave', this.endDrag.bind(this));
        this.container.addEventListener('touchend', this.endDrag.bind(this));
        this.container.addEventListener('touchleave', this.endDrag.bind(this));
        this.container.addEventListener('touchcancel', this.endDrag.bind(this));
    }

    getMousePosition(evt) {
        var CTM = this.container.getScreenCTM();
        if (evt.touches) { evt = evt.touches[0]; }
        return {
            x: (evt.clientX - CTM.e) / CTM.a,
            y: (evt.clientY - CTM.f) / CTM.d
        };
    }

    inp_click(evt) {
        if (this.selectedElement) {
            if (evt.target != this.selectedElement) {
                this.deselectfunction(this.selectedElement.id);
                this.selectedElement.classList.remove("selected");
                this.selectedElement = false;
            }
        }
        if (Object.keys(this.objects).includes(evt.target.id)) {
            this.selectedElement = evt.target;
            this.selectedElement.classList.add("selected");
            this.selectfunction(this.selectedElement.id);
        }
        if (evt.target.classList.contains('draggable')) {
            this.startDrag(evt);
        }
    }

    startDrag(evt) {
        // based on http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
        this.draggingElement = evt.target;
        this.offset = this.getMousePosition(evt);

        // Make sure the first transform on the element is a translate transform
        let transforms = this.draggingElement.transform.baseVal;

        if (transforms.length === 0 || transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
            // Create an transform that translates by (0, 0)
            let translate = this.container.createSVGTransform();
            translate.setTranslate(0, 0);
            this.draggingElement.transform.baseVal.insertItemBefore(translate, 0);
        }

        // Get initial translation
        this.transform = transforms.getItem(0);
        this.offset.x -= this.transform.matrix.e;
        this.offset.y -= this.transform.matrix.f;
    }

    drag(evt) {
        if (this.draggingElement) {
            evt.preventDefault();

            var coord = this.getMousePosition(evt);
            var dx = coord.x - this.offset.x;
            var dy = coord.y - this.offset.y;

            this.transform.setTranslate(dx, dy);

            const tf = this.draggingElement.transform.baseVal[0];
            this.objects[this.draggingElement.id].left = tf.matrix.e;
            this.objects[this.draggingElement.id].top = tf.matrix.f;

            this.dragfunction(this.draggingElement.id);
        }
    }

    endDrag(evt) {
        if (this.draggingElement) {
            if (evt.target != this.container) {
                const tf = this.draggingElement.transform.baseVal[0];
                this.objects[this.draggingElement.id].left = tf.matrix.e;
                this.objects[this.draggingElement.id].top = tf.matrix.f;
            }
            this.enddragfunction(this.draggingElement.id);
            this.draggingElement = false;
            this.transform = false;
            this.offset = false;
            this.saveObjects();
        }
    }

    createSVGElement(tag, attributes) {
        let new_element = document.createElementNS("http://www.w3.org/2000/svg", tag)
        for (let [attribute, value] of Object.entries(attributes)) {
            new_element.setAttributeNS(null, attribute, value);
        }
        return new_element;
    }

    addCustomSVGElement(data) {
        if (!data.id) {
            data.id = uuidv4();
        }
        if (!data.left) {
            data.left = this.default_x;
        }
        if (!data.top) {
            data.top = this.default_y;
        }
        if (!data.z) {
            data.z = this.default_z;
        }
        if (!data.note) {
            data.note = "";
        }
        if (!data.title) {
            data.title = "";
        }

        let new_element = this.createSVGElement(data.tag, data);

        new_element.setAttributeNS(null, "stroke", "black");
        new_element.setAttributeNS(null, "stroke-width", "1");
        new_element.setAttributeNS(null, "z-index", data.z);
        new_element.classList.add("draggable");

        let translate = this.container.createSVGTransform();
        translate.setTranslate(data.left, data.top);
        new_element.transform.baseVal.insertItemBefore(translate, 0);

        this.objects[data.id] = data;
        this.container.appendChild(new_element);

        this.saveObjects();
    }

    deleteObject(id) {
        const element = document.getElementById(id);
        element.parentElement.removeChild(element);
        delete this.objects[id];
    }

    updateObject(id, data) {
        // console.log('updating', id, data);

        // TODO update instead of delete and recreate
        this.deleteObject(id);
        this.importElement(data);
    }

    zoomIn() {
        this.zoom *= 0.5;
        this.updateZoom();
        this.saveZoom();
    }

    zoomOut() {
        this.zoom *= 2;
        this.updateZoom();
        this.saveZoom();
    }

    updateZoom() {
        const [left, top, width, height] = [(100 - this.zoom) / 2, (100 - this.zoom) / 2, this.zoom, this.zoom];
        this.container.setAttribute('viewBox', `${left} ${top} ${width} ${height}`);
    }

    load() {
        this.loadZoom();
        this.loadObjects();
    }

    loadZoom() {
        const zoom = window.localStorage.getItem(this.storage_option_prefix + "zoom");
        if (zoom) {
            this.zoom = +zoom;
        }
        this.updateZoom();
    }

    loadObjects() {
        for (let [key, val] of Object.entries(window.localStorage)) {
            if (key.indexOf(this.storage_object_prefix) == 0) {
                this.importElement(JSON.parse(val));
            }
        }
    }

    save() {
        this.saveZoom();
        this.saveObjects();
    }

    saveZoom() {
        window.localStorage.setItem(this.storage_option_prefix + "zoom", this.zoom);
        console.log('saving zoom', this.zoom);
    }

    saveObjects() {
        for (let [key, val] of Object.entries(this.objects)) {
            window.localStorage.setItem(this.storage_object_prefix + key, JSON.stringify(val));
        }
    }

    importElement(data) {
        this.addCustomSVGElement(data);
    }
}