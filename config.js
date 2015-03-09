config = {
    field: {
        size: [5, 5]
    },
    numbers: {
        // [number, ration or %]
        possibleValues: [
            [1, 1],
            [2, 1],
            [3, 1]
        ]
    },
    chain: {
        minLength: 3
    },
    levels: {
        1: {
            field: {
                size: [4, 4]
            },
            numbers: {
                possibleValues: [
                    [1, 1],
                    [2, 1]
                ]
            },
            chain: {
                minLength: 3
            },
            winCondition: {
                score: 5000
            }
        },
        2: {
            field: {
                size: [5, 5]
            },
            numbers: {
                possibleValues: [
                    [1, 1],
                    [2, 1],
                    [3, 1]
                ]
            },
            chain: {
                minLength: 3
            },
            winCondition: {
                score: 5000
            }
        }
    }
};
