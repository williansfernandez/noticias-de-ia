document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submit-comment');
    const commentTextarea = document.getElementById('comment-text');
    const commentsList = document.getElementById('comments-list');
    const commentWarning = document.getElementById('comment-warning');

    // Function to analyze the comment for offensive language (Enhanced)
    function isCommentOffensive(comment) {
        const lowerCaseComment = comment.toLowerCase().trim();

        // Expanded lists for better accuracy
        const sensitiveWords = [
            "negro", "mierda", "puta", "cabrón", "gilipollas", "joder", "marica", "zorra",
            "subnormal", "retrasado", "maldito", "bastardo", "imbécil", "estúpido", "idiota",
            "pendejo", "culero", "chinga", "pinche", "puto" // Added more Spanish offensive terms
        ];
        const offensivePatterns = [
            "negro de mierda", "negra de mierda", "puta madre", "hijo de puta", "hija de puta",
            "me cago en tu puta madre", "cabrón de mierda", "negro bruto", "negra bruta",
            "marica de mierda", "maldito seas", "pinche pendejo", "vete a la mierda",
            "chupa pollas", "come mierda" // Added more varied offensive patterns
        ];
        // Benign contexts help avoid flagging harmless uses of sensitive words.
        // Order matters less here, focusing on co-occurrence.
        const benignContexts = [
            "televisor", "coche", "humor", "libro", "gato", "perro", "color", "ropa",
            "arte", "película", "canción", "objeto", "pintura", "comida", "chiste", "broma"
            // Added more general terms
        ];
        const negationWords = ["no", "nunca", "jamás", "tampoco", "para nada", "de ninguna manera"];

        // 1. Check for direct offensive patterns (high priority)
        for (const pattern of offensivePatterns) {
            if (lowerCaseComment.includes(pattern)) {
                console.log("Offensive pattern found:", pattern);
                return true;
            }
        }

        // 2. Check for sensitive words, considering negations and benign contexts
        for (const word of sensitiveWords) {
            if (lowerCaseComment.includes(word)) {
                // a. Check for negations immediately around the sensitive word
                // Example: "no es negro ofensivo", "él no es un cabrón"
                let isNegated = false;
                for (const negation of negationWords) {
                    if (lowerCaseComment.includes(negation + " " + word) ||
                        lowerCaseComment.includes(negation + " es " + word) || // e.g. no es [palabra]
                        lowerCaseComment.includes(word + " " + negation)) { // less common but possible
                        // Further check: ensure the negation isn't part of a larger offensive phrase that bypasses pattern matching
                        // This is tricky; for now, a simple negation check might suffice for basic cases.
                        // A more advanced system would parse sentence structure.
                        console.log("Sensitive word '"+word+"' found with negation '"+negation+"'. Potentially not offensive here.");
                        isNegated = true;
                        break;
                    }
                }
                if (isNegated) {
                    // If negated, assume it's not offensive in this specific instance.
                    // This is a heuristic. "No es un cabrón, es un santo" vs "No, es un cabrón". Context is hard.
                    // For now, if negated, we'll lean towards it being non-offensive *for this specific word occurrence*.
                    // The comment might still be offensive due to other words/patterns.
                    continue; // Move to the next sensitive word check
                }

                // b. Check if the sensitive word is part of a benign context
                // We look for the benign word anywhere in the comment for simplicity,
                // assuming its presence *might* indicate a non-offensive context for the sensitive word.
                // A more advanced check would look at proximity.
                let inBenignContext = false;
                for (const contextItem of benignContexts) {
                    if (lowerCaseComment.includes(contextItem)) {
                        // Check if the context word is reasonably close or in a phrase with the sensitive word
                        // This is a simplified proximity check.
                        const wordIndex = lowerCaseComment.indexOf(word);
                        const contextIndex = lowerCaseComment.indexOf(contextItem);
                        // Check if context word is within a certain window (e.g., 2-3 words)
                        // or if the comment is short, making co-occurrence more significant.
                        if (Math.abs(wordIndex - contextIndex) < 20 || lowerCaseComment.length < 30) {
                           console.log("Sensitive word '"+word+"' found with benign context item '"+contextItem+"'.");
                           inBenignContext = true;
                           break;
                        }
                    }
                }

                if (inBenignContext) {
                    // If in a benign context, this specific sensitive word might be okay.
                    // Continue checking other parts of the comment.
                    // This doesn't mean the whole comment is fine, just this instance of the word.
                    continue;
                }

                // c. If sensitive word is found, not negated, and not in a clear benign context, flag as offensive.
                console.log("Sensitive word found without clear benign context or negation:", word);
                return true;
            }
        }

        // 3. If no offensive patterns or uncontextualized/non-negated sensitive words are found
        return false;
    }

    // Function to display a new comment in the list
    function displayComment(comment) {
        const commentElement = document.createElement('div');
        commentElement.classList.add('comment-item'); // Added a class for styling

        const commentAvatar = document.createElement('div');
        commentAvatar.classList.add('comment-avatar');
        commentAvatar.textContent = 'U'; // Placeholder for User Avatar

        const commentContent = document.createElement('div');
        commentContent.classList.add('comment-content');

        const commentAuthor = document.createElement('p');
        commentAuthor.classList.add('comment-author');
        commentAuthor.textContent = 'Usuario Anónimo'; // Placeholder author

        const commentText = document.createElement('p');
        commentText.textContent = comment;

        commentContent.appendChild(commentAuthor);
        commentContent.appendChild(commentText);

        commentElement.appendChild(commentAvatar);
        commentElement.appendChild(commentContent);

        commentsList.appendChild(commentElement);
        commentWarning.style.display = 'none'; // Ensure warning is hidden when a comment is successfully posted
    }

    // Function to show the warning message
    function showWarning() {
        commentWarning.style.display = 'block';
    }

    // Function to hide the warning message
    function hideWarning() {
        commentWarning.style.display = 'none';
    }

    submitButton.addEventListener('click', () => {
        const comment = commentTextarea.value.trim();
        hideWarning(); // Hide any previous warnings

        if (comment) {
            if (isCommentOffensive(comment)) {
                showWarning();
            } else {
                displayComment(comment);
                commentTextarea.value = ''; // Clear the textarea
            }
        } else {
            alert("Por favor, escribe un comentario.");
        }
    });
});
