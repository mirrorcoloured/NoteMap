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
        this.resizingElement = false;
        this.resizeEdges = false;
        this.initial = false;
        this.selectedElement = false;
        this.selectfunction = (id) => console.log('selected', id);
        this.deselectfunction = (id) => null;
        this.dragfunction = (id) => null;
        this.enddragfunction = (id) => console.log('ended drag for', id);
        this.resizefunction = (id) => null;
        this.endresizefunction = (id) => null;

        this.storage_option_prefix = "NoteMap_";
        this.storage_object_prefix = "NoteMapSVG_";
        this.zoom = 100;
        this.default_x = 50;
        this.default_y = 50;
        this.default_z = 1;
        this.resize_edge_width = 2;

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

    cursor_on_shape_edge(coordinates, element, edge_width = 1) {
        let edges = [];
        if (element.tagName == "rect") {
            const left = Number(element.getAttribute('left'))
            const right = left + Number (element.getAttribute('width'));
            const top = Number(element.getAttribute('top'))
            const bottom = top + Number (element.getAttribute('height'));
            if (Math.abs(coordinates.x - left) <= edge_width) {
                edges.push("left");
            }
            if (Math.abs(coordinates.x - right) <= edge_width) {
                edges.push("right");
            }
            if (Math.abs(coordinates.y - top) <= edge_width) {
                edges.push("top");
            }
            if (Math.abs(coordinates.y - bottom) <= edge_width) {
                edges.push("bottom");
            }
        } else if (element.tagName == "circle") {
            const x = Number(element.getAttribute('left'));
            const y = Number(element.getAttribute('top'));
            const radius = Number(element.getAttribute('r'));
            const r = Math.sqrt(Math.pow(coordinates.x - x, 2) + Math.pow(coordinates.y - y, 2));
            if (Math.abs(radius - r) <= edge_width) {
                edges.push("circumference");
            }
        }
        return edges;
    }

    inp_click(evt) {
        const coordinates = this.getMousePosition(evt);
        const target = evt.target;

        if (this.selectedElement) {
            if (target != this.selectedElement) {
                this.deselectfunction(this.selectedElement.id);
                this.selectedElement.classList.remove("selected");
                this.selectedElement = false;
            }
        }
        if (Object.keys(this.objects).includes(target.id)) {
            this.selectedElement = target;
            this.selectedElement.classList.add("selected");
            this.selectfunction(this.selectedElement.id);
        }
        if (target.classList.contains('resizeable')) {
            const edges = this.cursor_on_shape_edge(coordinates, target, this.resize_edge_width);
            if (edges.length > 0) {
                this.startResize(evt, edges);
                return 0;
            }
        }
        if (target.classList.contains('draggable')) {
            this.startDrag(evt);
            return 0;
        }
    }

    startDrag(evt) {
        // based on http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
        this.draggingElement = evt.target;
        this.offset = this.getMousePosition(evt);

        // Make sure the first transform on the element is a translate transform
        let transforms = this.draggingElement.transform.baseVal;

        // Get initial translation
        this.transform = transforms.getItem(0);
        this.offset.x -= this.transform.matrix.e;
        this.offset.y -= this.transform.matrix.f;
    }

    startResize(evt, edges) {
        this.resizingElement = evt.target;
        this.resizeEdges = edges;

        this.offset = this.getMousePosition(evt);
        this.initial = this.getPosition(this.resizingElement);

        this.transform = this.resizingElement.transform.baseVal.getItem(0);
    }

    drag(evt) {
        const coord = this.getMousePosition(evt);
        const target = evt.target;

        // Set cursor for resizing edges
        if (Object.keys(this.objects).includes(target.id)) {
            if (target.classList.contains("resizeable")) {
                const edges = this.cursor_on_shape_edge(coord, target, this.resize_edge_width);
                if (edges.length > 0) {
                    if (target.tagName == "rect") {
                        if (edges.includes("left") && edges.includes("top")) {
                            target.setAttribute("style", "cursor:nw-resize;")
                        } else if (edges.includes("right") && edges.includes("top")) {
                            target.setAttribute("style", "cursor:ne-resize;")
                        } else if (edges.includes("right") && edges.includes("bottom")) {
                            target.setAttribute("style", "cursor:se-resize;")
                        } else if (edges.includes("left") && edges.includes("bottom")) {
                            target.setAttribute("style", "cursor:sw-resize;")
                        } else if (edges.includes("left") || edges.includes("right")) {
                            target.setAttribute("style", "cursor:ew-resize;")
                        } else if (edges.includes("top") || edges.includes("bottom")) {
                            target.setAttribute("style", "cursor:ns-resize;")
                        }
                    } else if (target.tagName == "circle") {
                        if (edges.includes("circumference")) {
                            target.setAttribute("style", "cursor:crosshair;");
                        }
                    }
                } else {
                    target.setAttribute("style", "")
                }
            }
        }

        if (this.draggingElement) {
            evt.preventDefault();

            let dx = coord.x - this.offset.x;
            let dy = coord.y - this.offset.y;

            target.setAttribute("left", dx);
            target.setAttribute("top", dy);

            this.transform.setTranslate(dx, dy);

            const tf = this.draggingElement.transform.baseVal[0];
            this.objects[this.draggingElement.id].left = tf.matrix.e;
            this.objects[this.draggingElement.id].top = tf.matrix.f;

            this.dragfunction(this.draggingElement.id);
        }

        if (this.resizingElement) {
            evt.preventDefault();
            let dx = coord.x - this.offset.x;
            let dy = coord.y - this.offset.y;

            if (this.resizingElement.tagName == "rect") {
                let new_left = this.initial.left;
                let new_top = this.initial.top;
                let new_width = this.initial.width;
                let new_height = this.initial.height;

                if (this.resizeEdges.includes("left")) {
                    new_left = this.initial.left + dx;
                    new_width = this.initial.width - dx;
                } else if (this.resizeEdges.includes("right")) {
                    new_width = this.initial.width + dx;
                }
                if (this.resizeEdges.includes("top")) {
                    new_top = this.initial.top + dy;
                    new_height = this.initial.height - dy;
                } else if (this.resizeEdges.includes("bottom")) {
                    new_height = this.initial.height + dy;
                }

                this.transform.setTranslate(new_left, new_top);
                this.resizingElement.setAttribute("left", new_left);
                this.resizingElement.setAttribute("top", new_top);
                this.objects[this.resizingElement.id].left = new_left;
                this.objects[this.resizingElement.id].top = new_top;
                if (new_width > 0) {
                    this.resizingElement.setAttribute("width", new_width);
                    this.objects[this.resizingElement.id].width = new_width;
                }
                if (new_height > 0) {
                    this.resizingElement.setAttribute("height", new_height);
                    this.objects[this.resizingElement.id].height = new_height;
                }

            } else if (this.resizingElement.tagName == "circle") {
                const dr = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
                // console.log('dr', dr);

                // let new_r = this.initial.radius + dr;
                let new_r = Math.sqrt(Math.pow(coord.x - this.initial.cx, 2) + Math.pow(coord.y - this.initial.cy, 2));
                console.log('initial', this.initial, 'new r', new_r);
                // console.log('old r', this.initial.radius, 'new r', new_r);

                this.resizingElement.setAttribute("r", new_r);
                this.objects[this.resizingElement.id].r = new_r;
            }
            this.resizefunction(this.resizingElement.id);
        }
    }

    getPosition(element) {
        if (this.resizingElement.tagName == "rect") {
            return {
                left: Number(element.getAttribute("left")),
                top: Number(element.getAttribute("top")),
                width: Number(element.getAttribute("width")),
                height: Number(element.getAttribute("height")),
            }
        } else if (this.resizingElement.tagName == "circle") {
            return {
                radius: Number(element.getAttribute("r")),
                cx: Number(element.getAttribute("left")) + Number(element.getAttribute("r")),
                cy: Number(element.getAttribute("top")) + Number(element.getAttribute("r")),
                left: Number(element.getAttribute("left")),
                top: Number(element.getAttribute("top")),
                width: Number(element.getAttribute("left")) + Number(element.getAttribute("r")) * 2,
                height: Number(element.getAttribute("top")) + Number(element.getAttribute("r")) * 2,
            }
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
        }

        if (this.resizingElement) {
            this.endresizefunction(this.resizingElement.id);
            this.resizingElement = false;
            this.resizeEdges = false;
            this.initial = false;
        }

            this.saveObjects();
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

        new_element.setAttributeNS(null, "z-index", data.z);
        new_element.classList.add("draggable");
        new_element.classList.add("resizeable");

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