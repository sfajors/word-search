document.addEventListener('DOMContentLoaded', () => {
    const checkBtn = document.getElementById('checkBtn');
    const nextLevelBtn = document.getElementById('nextLevelBtn');

    let currentLevelIndex = 0; // Start at level 0 (Level 1)
    let gameLocked = false; // Flag to lock the game after 5 incorrect attempts
    let incorrectAttempts = 0;
    let previousAttempts = []; // Array to store previous incorrect attempts
    let draggedItem = null;
    let offsetX = 0;
    let offsetY = 0;
    let containerRect = null;

    // Define the levels data
    const levels = [
        {
            levelNumber: 1,
            levelName: "Organisms by Habitat",
            categories: [
                { id: 'forest', name: 'Forest', hint: 'Think of areas dense with trees and rich in wildlife.' },
                { id: 'desert', name: 'Desert', hint: 'Look for hardy, water-storing plants.', },
                { id: 'ocean', name: 'Ocean', hint: 'Consider the vast, deep bodies of saltwater teeming with marine life.', }
            ],
            draggables: [
                { id: 'bear', name: 'Bear', category: 'forest' },
                { id: 'cactus', name: 'Cactus', category: 'desert' },
                { id: 'dolphin', name: 'Dolphin', category: 'ocean' }
            ]
        },
        {
            levelNumber: 2,
            levelName: "Sort by Adaptation",
            categories: [
                { id: 'camouflage', name: 'Camouflage', hint: 'Animals that blend into their surroundings.' },
                { id: 'longNeck', name: 'Long Neck', hint: 'Animals with elongated necks for reaching high foliage.' },
                { id: 'nocturnal', name: 'Nocturnal', hint: 'Animals active during the night.' }
            ],
            draggables: [
                { id: 'chameleon', name: 'Chameleon', category: 'camouflage' },
                { id: 'giraffe', name: 'Giraffe', category: 'longNeck' },
                { id: 'owl', name: 'Owl', category: 'nocturnal' }
            ]
        },
        {
            levelNumber: 3,
            levelName: "Evolutionary Connections",
            categories: [
                { id: 'mammals', name: 'Mammals', hint: 'Warm-blooded animals with hair or fur.' },
                { id: 'reptiles', name: 'Reptiles', hint: 'Cold-blooded animals with scales.' },
                { id: 'amphibians', name: 'Amphibians', hint: 'Animals that live both in water and on land.' }
            ],
            draggables: [
                { id: 'human', name: 'Human', category: 'mammals' },
                { id: 'snake', name: 'Snake', category: 'reptiles' },
                { id: 'frog', name: 'Frog', category: 'amphibians' }
            ]
        }
    ];    

    function loadLevel() {
        const level = levels[currentLevelIndex];
        const categoriesContainer = document.querySelector('.categories');
        const draggablesContainer = document.querySelector('.draggable-items');
        const levelNameElement = document.getElementById('levelName');

        // Set the level name
        levelNameElement.textContent = level.levelName;

        // Clear existing content
        categoriesContainer.innerHTML = '';
        draggablesContainer.innerHTML = '';

        // Load categories
        level.categories.forEach(categoryData => {
            const categoryContainer = document.createElement('div');
            categoryContainer.classList.add('category-container');

            const category = document.createElement('div');
            category.classList.add('category');
            category.setAttribute('id', categoryData.id);
            category.setAttribute('data-category', categoryData.id);

            // Set background image if provided
            if (categoryData.backgroundImage) {
                category.style.backgroundImage = `url('${categoryData.backgroundImage}')`;
                category.style.backgroundSize = 'cover';
                category.style.backgroundPosition = 'center';
            }

            const categoryTitle = document.createElement('h2');
            categoryTitle.textContent = categoryData.name;
            category.appendChild(categoryTitle);
            categoryContainer.appendChild(category);

            categoriesContainer.appendChild(categoryContainer);
        });

        // Load draggables
        level.draggables.forEach(draggableData => {
            const draggable = document.createElement('div');
            draggable.classList.add('draggable');
            draggable.setAttribute('id', draggableData.id);
            draggable.setAttribute('data-category', draggableData.category);

            const draggableText = document.createElement('p');
            draggableText.textContent = draggableData.name;
            draggable.appendChild(draggableText);

            draggablesContainer.appendChild(draggable);
        });

        // Re-initialize variables and event listeners
        initializeGame();
    }

    function initializeGame() {
        gameLocked = false;
        incorrectAttempts = 0;
        previousAttempts = [];

        const draggables = document.querySelectorAll('.draggable');
        const categories = document.querySelectorAll('.category');

        // Remove any existing hints
        const hints = document.querySelectorAll('.hint');
        hints.forEach(hint => hint.remove());

        // Remove 'correct' and 'incorrect' classes
        categories.forEach(category => {
            category.classList.remove('correct', 'incorrect');
        });

        // Attach event listeners to new draggables
        draggables.forEach(draggable => {
            draggable.addEventListener('pointerdown', pointerDownHandler);
        });
    }

    function pointerDownHandler(e) {
        if (gameLocked) return; // Do nothing if the game is locked

        e.preventDefault(); // Prevent default touch behavior
        draggedItem = e.target.closest('.draggable');
        if (!draggedItem) return;

        // Get the bounding rectangle of the container
        const container = document.querySelector('.game-container');
        containerRect = container.getBoundingClientRect();

        // Get the bounding rectangle of the dragged item
        const draggedRect = draggedItem.getBoundingClientRect();

        // Calculate the offset between the pointer and the top-left corner of the item
        offsetX = e.clientX - draggedRect.left;
        offsetY = e.clientY - draggedRect.top;

        // Set the dragged item to absolute positioning
        draggedItem.style.position = 'absolute';
        draggedItem.style.zIndex = 1000;
        draggedItem.style.left = `${e.clientX - containerRect.left - offsetX}px`;
        draggedItem.style.top = `${e.clientY - containerRect.top - offsetY}px`;
        draggedItem.style.width = `${draggedRect.width}px`; // Maintain width
        draggedItem.style.cursor = 'grabbing';
        draggedItem.classList.add('dragging');

        // Move the dragged item to the container to allow absolute positioning
        container.appendChild(draggedItem);

        // Attach pointermove and pointerup handlers to the document
        document.addEventListener('pointermove', pointerMoveHandler);
        document.addEventListener('pointerup', pointerUpHandler);
    }

    function pointerMoveHandler(e) {
        if (draggedItem) {
            // Calculate new position relative to the container
            let newLeft = e.clientX - containerRect.left - offsetX;
            let newTop = e.clientY - containerRect.top - offsetY;

            // Optional: Restrict the draggable within the container boundaries
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;
            const itemWidth = draggedItem.offsetWidth;
            const itemHeight = draggedItem.offsetHeight;

            // Prevent the item from being dragged outside the container
            newLeft = Math.max(0, Math.min(newLeft, containerWidth - itemWidth));
            newTop = Math.max(0, Math.min(newTop, containerHeight - itemHeight));

            draggedItem.style.left = `${newLeft}px`;
            draggedItem.style.top = `${newTop}px`;
        }
    }

    function pointerUpHandler(e) {
        if (draggedItem) {
            // Temporarily disable pointer events on the dragged item
            draggedItem.style.pointerEvents = 'none';

            // Determine drop target
            const dropTarget = document.elementFromPoint(e.clientX, e.clientY);

            // Re-enable pointer events
            draggedItem.style.pointerEvents = 'auto';

            if (dropTarget) {
                const category = dropTarget.closest('.category');
                if (category) {
                    category.appendChild(draggedItem);
                } else {
                    // Return to original position if not dropped on a category
                    const draggableItemsContainer = document.querySelector('.draggable-items');
                    draggableItemsContainer.appendChild(draggedItem);
                }
            } else {
                // Return to original position if drop target not found
                const draggableItemsContainer = document.querySelector('.draggable-items');
                draggableItemsContainer.appendChild(draggedItem);
            }

            // Reset styles to allow natural placement
            resetDraggedItemStyles();

            // Remove event listeners
            document.removeEventListener('pointermove', pointerMoveHandler);
            document.removeEventListener('pointerup', pointerUpHandler);
        }
    }

    function resetDraggedItemStyles() {
        if (draggedItem) {
            draggedItem.style.position = 'relative';
            draggedItem.style.left = '0px';
            draggedItem.style.top = '0px';
            draggedItem.style.zIndex = 'auto';
            draggedItem.style.cursor = 'grab';
            draggedItem.style.width = '100px'; // Reset width
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
    }

    function draggablesArray() {
        return Array.from(document.querySelectorAll('.draggable'));
    }

    // Check answers
    checkBtn.addEventListener('click', () => {
        if (gameLocked) return; // Do nothing if the game is locked
    
        // Serialize the current attempt
        const currentAttempt = draggablesArray().map(draggable => {
            return {
                id: draggable.id,
                parentCategory: draggable.parentElement.getAttribute('data-category')
            };
        });
    
        // Check if the current attempt matches any previous incorrect attempts
        const isRepeatAttempt = previousAttempts.some(attempt => {
            return JSON.stringify(attempt) === JSON.stringify(currentAttempt);
        });
    
        if (isRepeatAttempt) {
            showFeedback('You have already tried this arrangement. Please try a different one.');
            return;
        }
    
        let allCorrect = true;
    
        // Reset previous feedback
        const categories = document.querySelectorAll('.category');
        categories.forEach(category => {
            category.classList.remove('correct', 'incorrect');
        });
    
        draggablesArray().forEach(draggable => {
            const parentElement = draggable.parentElement;
            const parentCategory = parentElement.getAttribute('data-category');
            const correctCategory = draggable.getAttribute('data-category');
    
            if (parentCategory === correctCategory) {
                // Only add 'correct' class if parent is a category
                if (parentElement.classList.contains('category')) {
                    parentElement.classList.add('correct');
                    parentElement.classList.remove('incorrect');
                }
            } else {
                allCorrect = false;
                // Only add 'incorrect' class if parent is a category
                if (parentElement.classList.contains('category')) {
                    parentElement.classList.add('incorrect');
                    parentElement.classList.remove('correct');
                }
            }
        });
    
        if (allCorrect) {
            // All items are correctly placed
            showFeedback('Congratulations! All items are correctly placed.');
            incorrectAttempts = 0; // Reset incorrect attempts
            previousAttempts = []; // Clear previous attempts
    
            // Proceed to next level or end game
            checkBtn.style.display = 'none';
            if (currentLevelIndex < levels.length - 1) {
                nextLevelBtn.style.display = 'block';
            } else {
                // Only show congratulations modal when the last level is completed
                showCongratulationsModal();
            }
        } else {
            // Some items are incorrectly placed
            incorrectAttempts++;
    
            // Store the current incorrect attempt
            previousAttempts.push(currentAttempt);
    
            if (incorrectAttempts === 3) {
                // After three incorrect attempts, display hints
                showHints();
                showFeedback('Here are some hints to help you!');
            }
    
            if (incorrectAttempts === 5) {
                // After five incorrect attempts, automatically move items to correct categories
                showFeedback('Maximum attempts reached. The items have been moved to their correct categories.');
                moveItemsToCorrectCategories();
                lockGame();
    
                // Proceed to next level or end game
                checkBtn.style.display = 'none';
                if (currentLevelIndex < levels.length - 1) {
                    nextLevelBtn.style.display = 'block';
                } else {
                    showCongratulationsModal();
                }
            } else {
                showFeedback('Some items are incorrectly placed. Try again.');
            }
        }
    });    

    function showHints() {
        const categoryContainers = document.querySelectorAll('.category-container');
        const level = levels[currentLevelIndex];

        // Define the hints for each category from the current level data
        const categoryHints = {};
        level.categories.forEach(categoryData => {
            categoryHints[categoryData.id] = categoryData.hint || "Here's a hint for this category.";
        });

        categoryContainers.forEach(container => {
            const category = container.querySelector('.category');
            // Check if hint already exists to prevent duplicates
            if (!container.querySelector('.hint')) {
                const categoryName = category.getAttribute('data-category');
                const hintText = categoryHints[categoryName] || "Here's a hint for this category.";
                const hint = document.createElement('div');
                hint.classList.add('hint');
                hint.textContent = hintText;
                container.appendChild(hint);
            }
        });
    }

    function moveItemsToCorrectCategories() {
        // Remove hints if any
        const hints = document.querySelectorAll('.hint');
        hints.forEach(hint => hint.remove());

        draggablesArray().forEach(draggable => {
            const correctCategoryName = draggable.getAttribute('data-category');
            const correctCategory = document.querySelector(`.category[data-category="${correctCategoryName}"]`);
            correctCategory.appendChild(draggable);

            // Reset styles and lock the draggable
            draggable.style.position = 'relative';
            draggable.style.left = '0px';
            draggable.style.top = '0px';
            draggable.style.zIndex = 'auto';
            draggable.style.cursor = 'default'; // Change cursor to default
            draggable.style.width = '100px';
            draggable.classList.remove('dragging');
            draggable.classList.add('locked'); // Add locked class
        });
    }

    function lockGame() {
        gameLocked = true;
        // Disable drag events by removing event listeners
        draggablesArray().forEach(draggable => {
            draggable.removeEventListener('pointerdown', pointerDownHandler);
        });
    }

    function showFeedback(message) {
        const feedbackContainer = document.getElementById('feedback');
        if (feedbackContainer) {
            // Update existing feedback container
            feedbackContainer.textContent = message;
        } else {
            // Create a new feedback container
            const feedback = document.createElement('div');
            feedback.id = 'feedback';
            feedback.style.position = 'fixed';
            feedback.style.bottom = '10px';
            feedback.style.left = '50%';
            feedback.style.transform = 'translateX(-50%)';
            feedback.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            feedback.style.color = 'white';
            feedback.style.padding = '10px 20px';
            feedback.style.borderRadius = '5px';
            feedback.style.zIndex = '1001';
            feedback.textContent = message;
            document.body.appendChild(feedback);

            // Remove the feedback message after a few seconds
            setTimeout(() => {
                feedback.remove();
            }, 3000);
        }
    }

    nextLevelBtn.addEventListener('click', () => {
        currentLevelIndex++;
        if (currentLevelIndex < levels.length) {
            loadLevel();
            checkBtn.style.display = 'block';
            nextLevelBtn.style.display = 'none';
            showFeedback(`Welcome to Level ${currentLevelIndex + 1}: ${levels[currentLevelIndex].levelName}!`);
        } else {
            // Show the Congratulations modal
            showCongratulationsModal();
            nextLevelBtn.style.display = 'none';
        }
    });

    function showCongratulationsModal() {
        const congratsModal = document.getElementById('congratsModal');
        const mainContent = document.getElementById('mainContent');
    
        if (currentLevelIndex === levels.length - 1) { // Only show on final level completion
            congratsModal.classList.remove('hidden');
            mainContent.classList.add('blur');
        }
    }       

    // Welcome Modal Functionality
    const welcomeModal = document.getElementById('welcomeModal'); // Use 'welcomemodal' as in HTML
    const startGameBtn = document.getElementById('startGameBtn');

    // Show the modal when the page loads
    welcomeModal.classList.remove('hidden');

    // Apply blur effect to the background content
    const mainContent = document.getElementById('mainContent');
    mainContent.classList.add('blur');

    // Start game button event listener
    startGameBtn.addEventListener('click', () => {
        // Hide the modal
        welcomeModal.classList.add('hidden');

        // Remove blur effect
        mainContent.classList.remove('blur');

        // Start the game by loading the first level
        loadLevel();
    });

    const restartGameBtn = document.getElementById('restartGameBtn');
    restartGameBtn.addEventListener('click', () => {
        // Hide the Congratulations modal
        const congratsModal = document.getElementById('congratsModal');
        congratsModal.classList.add('hidden');

        // Remove blur effect
        const mainContent = document.getElementById('mainContent');
        mainContent.classList.remove('blur');

        // Reset game variables
        currentLevelIndex = 0;
        loadLevel();
        checkBtn.style.display = 'block';
        nextLevelBtn.style.display = 'none';
    });
});