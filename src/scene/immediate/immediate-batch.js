import { Mat4 } from '../../math/mat4.js';

import { PRIMITIVE_LINES } from '../../graphics/constants.js';
import { Mesh } from '../../scene/mesh.js';
import { MeshInstance } from '../../scene/mesh-instance.js';
import { GraphNode } from '../../scene/graph-node.js';

const identityGraphNode = new GraphNode();
identityGraphNode.worldTransform = Mat4.IDENTITY;
identityGraphNode._dirtyWorld = identityGraphNode._dirtyNormal = false;

// helper class storing data for a single batch of line rendering using a single material
class ImmediateBatch {
    constructor(device, material, layer) {
        this.material = material;
        this.layer = layer;

        // line data, arrays of numbers
        this.positions = [];
        this.colors = [];

        this.mesh = new Mesh(device);
        this.meshInstance = null;
    }

    // add line positions and colors to the batch
    // this function expects position in Vec3 and colors in Color format
    addLines(positions, color) {

        // positions
        const destPos = this.positions;
        const count = positions.length;
        for (let i = 0; i < count; i++) {
            const pos = positions[i];
            destPos.push(pos.x, pos.y, pos.z);
        }

        // colors
        const destCol = this.colors;
        if (color.length) {
            // multi colored line
            for (let i = 0; i < count; i++) {
                const col = color[i];
                destCol.push(col.r, col.g, col.b, col.a);
            }
        } else {
            // single colored line
            for (let i = 0; i < count; i++) {
                destCol.push(color.r, color.g, color.b, color.a);
            }
        }
    }

    // add line positions and colors to the batch
    // this function expects positions as arrays of numbers
    // and color as instance of Color or array of number specifying the same number of vertices as positions
    addLinesArrays(positions, color) {

        // positions
        this.positions.push(...positions);

        // colors
        const destCol = this.colors;
        if (color.length) {
            // multi colored line
            destCol.push(...color);
        } else {
            // single colored line
            const count = positions.length / 3;
            for (let i = 0; i < count; i++) {
                destCol.push(color.r, color.g, color.b, color.a);
            }
        }
    }

    onPreRender(visibleList, transparent) {

        // prepare mesh if its transparency matches
        if (this.positions.length > 0 && this.material.transparent === transparent) {

            // update mesh vertices
            this.mesh.setPositions(this.positions);
            this.mesh.setColors(this.colors);
            this.mesh.update(PRIMITIVE_LINES, false);
            if (!this.meshInstance) {
                this.meshInstance = new MeshInstance(this.mesh, this.material, identityGraphNode);
            }

            // clear lines when after they were rendered as their lifetime is one frame
            this.positions.length = 0;
            this.colors.length = 0;

            // inject mesh instance into visible list to be rendered
            visibleList.list.push(this.meshInstance);
            visibleList.length++;
        }
    }
}

export { ImmediateBatch };
