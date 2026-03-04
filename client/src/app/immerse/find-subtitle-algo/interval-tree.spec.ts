import { IntervalTree, TreeNode } from "./interval-tree";

describe('IntervelTree', () => {

    class Intervel {
        low: number;
        high: number;
        value: string;

        constructor(low: number, high: number, value: string) {
            this.low = low;
            this.high = high;
            this.value = value;
        }
    }

    it('should create an instance', () => {
        const tree = new IntervalTree<number, number>(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, (a, b) => a - b);
        expect(tree).toBeTruthy();
    });

    it('should maintain red-black properties after insertions', () => {
         const tree = new IntervalTree<number, string>(Number.NEGATIVE_INFINITY, "", (a, b) => a - b);
        const elementsToInsert = [new Intervel(10, 20, "10-20"), new Intervel(15, 25, "15-25"), new Intervel(30, 40, "30-40"), new Intervel(5, 15, "5-15"), new Intervel(25, 35, "25-35")];

        for (const element of elementsToInsert) {
            tree.insert(element.low, element.high, element.value);
            rootIsBlack(tree);
            redNodeHasBlackChildren(tree);
            blackHeightConsistency(tree);
        }
    });

    it('should search correctly when intervals are single points', () => {
        const tree = new IntervalTree<number, string>(Number.NEGATIVE_INFINITY, "", (a, b) => a - b);
        const elementsToInsert = [
            new Intervel(50, 50, '50'),
            new Intervel(30, 30, '30'),
            new Intervel(70, 70, '70'),
            new Intervel(20, 20, '20'),
            new Intervel(40, 40, '40'),
            new Intervel(60, 60, '60'),
            new Intervel(80, 80, '80'),
        ];
        for (const element of elementsToInsert) {
            // value is same as key for simplicity
            tree.insert(element.low, element.high, element.value);
        }
        for (const element of elementsToInsert) {
            const result = tree.search(element.low, element.high);
            expect(result).not.toBeNull();
            expect(result).toBe(element.value);
        }
        expect(tree.search(-1, -1)).toBeNull();
    });

    it('should search correctly with overlapping intervals', () => {
        const tree = new IntervalTree<number, string>(Number.NEGATIVE_INFINITY, "", (a, b) => a - b);
        const elementsToInsert = [
            new Intervel(10, 20, '10-20'),
            new Intervel(30, 40, '30-40'),
            new Intervel(50, 60, '50-60'),
        ];
        for (const element of elementsToInsert) {
            tree.insert(element.low, element.high, element.value);
        }

        let result = tree.search(0, 9);
        expect(result).toBeNull();

        result = tree.search(0, 10);
        expect(result).not.toBeNull();
        expect(result).toBe("10-20");

        result = tree.search(10, 10);
        expect(result).not.toBeNull();
        expect(result).toBe("10-20");
        
        result = tree.search(5, 15);
        expect(result).not.toBeNull();
        expect(result).toBe("10-20");

        result = tree.search(10, 20);
        expect(result).not.toBeNull();
        expect(result).toBe("10-20");

        result = tree.search(15, 25);
        expect(result).not.toBeNull();
        expect(result).toBe("10-20");

        result = tree.search(70, 80);
        expect(result).toBeNull();
    });

    test('randomized insert and search test with single points', () => {
        const tree = new IntervalTree<number, string>(Number.NEGATIVE_INFINITY, "", (a, b) => a - b);
        const elementsToInsert = [];
        const numElements = 10000;
        for (let i = 0; i < numElements; i++) {
            const randomElement = Math.floor(Math.random() * 10000);
            elementsToInsert.push(new Intervel(randomElement, randomElement, randomElement.toString()));
            tree.insert(randomElement, randomElement, randomElement.toString());
        }
        for (const element of elementsToInsert) {
            const result = tree.search(element.low, element.high);
            expect(result).not.toBeNull();
            expect(result).toBe(element.value);
        }
        rootIsBlack(tree);
        redNodeHasBlackChildren(tree);
        blackHeightConsistency(tree);
    });
});

// invariant: root is black
function rootIsBlack(tree: IntervalTree<number, string>) {
    if (tree.root) {
        expect(tree.root.color).toBeFalsy();
    }
}

// invariant: red node has black children
function redNodeHasBlackChildren(tree: IntervalTree<number, string>) {
    const deque: TreeNode<number, string>[] = [];
    deque.push(tree.root);
    // BFS
    while (deque.length > 0) {
        const node = deque.shift()!;
        if (node.color === true) {
            expect(node.left.color).toBeFalsy();
            expect(node.right.color).toBeFalsy();
        }

        if (node.left !== tree.sentinel) {
            deque.push(node.left);
        }
        if (node.right !== tree.sentinel) {
            deque.push(node.right);
        }
    }

}

// invariant: all paths from a node to its descendant leaves have the same number of black nodes
function blackHeightConsistency(tree: IntervalTree<number, string>) {

    function isSentinel(node: TreeNode<number, string>): boolean {
        return node.left === node && node.right === node;
    }

    function blackHeight(node: TreeNode<number, string>): number {
        if (isSentinel(node)) {
            return 0;
        }

        const leftBlackHeight = blackHeight(node.left);
        const rightBlackHeight = blackHeight(node.right);
        expect(leftBlackHeight).toBe(rightBlackHeight);
        return leftBlackHeight + (node.color === false ? 1 : 0);
    }

    if (tree.root) {
        blackHeight(tree.root);
    }
}

