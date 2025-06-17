document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submit-comment');
    const commentTextarea = document.getElementById('comment-text');
    const commentsList = document.getElementById('comments-list');
    const commentWarning = document.getElementById('comment-warning');

    // Function to analyze the comment for offensive language
    function isCommentOffensive(comment) {
        const lowerCaseComment = comment.toLowerCase();

        // Lists of sensitive words and offensive patterns
        // These can be expanded and refined
        const sensitiveWords = ["negro", "mierda", "puta", "cabrón", "gilipollas", "joder"];
        const offensivePatterns = [
            "negro de mierda",
            "puta madre",
            "me cago en tu puta madre",
            "cabrón de mierda",
            "negro bruto" // As per the issue description
        ];
        const benignContexts = [ // Words that might make a sensitive word benign
            "televisor", "coche", "humor", "libro", "gato", "perro", "color"
        ];


        // 1. Check for direct offensive patterns
        for (const pattern of offensivePatterns) {
            if (lowerCaseComment.includes(pattern)) {
                console.log("Offensive pattern found:", pattern);
                return true; // Offensive if a direct pattern is matched
            }
        }

        // 2. Check for sensitive words and try to determine context
        for (const word of sensitiveWords) {
            if (lowerCaseComment.includes(word)) {
                // Check if the sensitive word is part of a benign context
                let isBenign = false;
                for (const context of benignContexts) {
                    // Example: "televisor negro" or "negro televisor"
                    if (lowerCaseComment.includes(context + " " + word) || lowerCaseComment.includes(word + " " + context)) {
                        isBenign = true;
                        break;
                    }
                }
                if (lowerCaseComment.includes("humor " + word)){ // e.g. humor negro
                    isBenign = true;
                }


                if (!isBenign) {
                    // If the sensitive word is found and not in a recognized benign context, flag as offensive.
                    // This is a simplification. True contextual analysis is much more complex.
                    console.log("Sensitive word found without clear benign context:", word);
                    return true;
                }
            }
        }

        return false; // Not offensive if no patterns or uncontextualized sensitive words are found
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
