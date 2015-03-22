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
            winConditions: [1000, 3000, 6000],
            goals: [
                'Goal: 1000',
                'Next goal: 3000',
                'Last goal: 6000',
                'Achieved!'
            ],
            ability: {
                hammer: {
                    count: 1
                }
            },
            abilityPerScore: 1000
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
            winConditions: [10000, 25000, 50000],
            goals: [
                'Goal: 10000',
                'Next goal: 25000',
                'Last goal: 50000',
                'Achieved!'
            ],
            ability: {
                hammer: {
                    count: 1
                }
            },
            abilityPerScore: 5000
        },
        3: {
            field: {
                size: [4, 4]
            },
            numbers: {
                possibleValues: [
                    [3, 1],
                    [5, 1],
                    [7, 1]
                ]
            },
            chain: {
                minLength: 3
            },
            winConditions: [500, 1250, 2500],
            goals: [
                'Goal: 500',
                'Next goal: 1250',
                'Last goal: 2500',
                'Achieved!'
            ],
            ability: {
                hammer: {
                    count: 1
                }
            },
            abilityPerScore: 250
        },
        4: {
            field: {
                size: [5, 5]
            },
            numbers: {
                possibleValues: [
                    [1, 32],
                    [3, 32],
                    [5, 32],
                    [135, 4]
                ]
            },
            chain: {
                minLength: 3
            },
            winConditions: [8000, 32000, 150000],
            goals: [
                'Goal: 80000',
                'Next goal: 32000',
                'Last goal: 150000',
                'Achieved!'
            ],
            ability: {
                hammer: {
                    count: 1
                }
            },
            abilityPerScore: 1000
        },
        5: {
            field: {
                size: [5, 5]
            },
            numbers: {
                possibleValues: [
                    [1, 1],
                    [2, 1],
                    [3, 1],
                    [5, 1]
                ]
            },
            chain: {
                minLength: 3
            },
            winConditions: [50, 100, 150],
            goals: [
                'Goal: 50',
                'Next goal: 100',
                'Last goal: 150',
                'Achieved!'
            ],
            ability: {
                hammer: {
                    count: 2
                },
                bomb: {
                    count: 1
                }
            },
            abilityPerScore: 20
        },
        6: {
            field: {
                size: [4, 4]
            },
            numbers: {
                possibleValues: [
                    [3, 1],
                    [5, 1],
                    [7, 1],
                    [105, 1],
                    [135, 1]
                ]
            },
            chain: {
                minLength: 3
            },
            winConditions: [50, 100, 150],
            goals: [
                'Goal: 50',
                'Next goal: 100',
                'Last goal: 150',
                'Achieved!'
            ],
            ability: {
                hammer: {
                    count: 3
                },
                bomb: {
                    count: 3
                }
            },
            abilityPerScore: 300
        }/*,
        7: {
            field: {
                size: [6, 6]
            },
            numbers: {
                possibleValues: [
                    [1, 1],
                    [2, 1],
                    [3, 1],
                    [5, 1],
                    [7, 1]
                ]
            },
            chain: {
                minLength: 3
            },
            winConditions: [50, 100, 150],
            goals: [
                'Goal: 50',
                'Next goal: 100',
                'Last goal: 150',
                'Achieved!'
            ],
            ability: {
                hammer: {
                    count: 2
                },
                bomb: {
                    count: 1
                }
            },
            abilityPerScore: 500
        },
        8: {
            field: {
                size: [5, 5]
            },
            numbers: {
                possibleValues: [
                    [1, 1],
                    [2, 1],
                    [3, 1],
                    [5, 1],
                    [7, 1]
                ]
            },
            chain: {
                minLength: 3
            },
            winConditions: [50, 100, 150],
            goals: [
                'Goal: 50',
                'Next goal: 100',
                'Last goal: 150',
                'Achieved!'
            ],
            ability: {
                hammer: {
                    count: 2
                },
                bomb: {
                    count: 1
                }
            },
            abilityPerScore: 500
        },
        9: {
            field: {
                size: [6, 6]
            },
            numbers: {
                possibleValues: [
                    [1, 1],
                    [3, 1],
                    [13, 1],
                    [7, 1]
                ]
            },
            chain: {
                minLength: 3
            },
            winConditions: [50, 100, 150],
            goals: [
                'Goal: 50',
                'Next goal: 100',
                'Last goal: 150',
                'Achieved!'
            ],
            ability: {
                hammer: {
                    count: 2
                },
                bomb: {
                    count: 1
                }
            },
            abilityPerScore: 500
        }*/
    }
};
