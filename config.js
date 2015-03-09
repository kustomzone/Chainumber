config = {
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
                score: 50
            },
            goal: '50'
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
                score: 1000
            },
            goal: '1000'
        }
    }
};
