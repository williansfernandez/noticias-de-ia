document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submit-comment');
    const commentTextarea = document.getElementById('comment-text');
    const commentsList = document.getElementById('comments-list');
    const commentWarning = document.getElementById('comment-warning');

// Function to analyze the comment for offensive language (Advanced Scoring System)
function isCommentOffensive(comment) {
    const lowerCaseComment = comment.toLowerCase().trim();
    if (!lowerCaseComment) return false; // Empty comments are not offensive

    let toxicityScore = 0;
    const TOXICITY_THRESHOLD = 10; // Umbral para considerar un comentario como tóxico

    // --- Definición de Listas y Pesos ---
    // Estos patrones/palabras suman directamente a la puntuación global
    const directScoreTerms = {
        // Alta Toxicidad (superan el umbral por sí solos o casi)
        "negro de mierda": 15, "negra de mierda": 15, "hijo de puta": 15, "hija de puta": 15,
        "me cago en tu puta madre": 15, "cabrón de mierda": 15, "marica de mierda": 15,
        "pinche pendejo": 12, "chinga tu madre": 15, "puto asco": 10,
        // Media-Alta Toxicidad (contribuyen significativamente)
        "mierda": 7, "puta": 7, "joder": 6, "cabrón": 7, "zorra": 7, "subnormal": 8,
        "retrasado": 8, "maldito": 6, "bastardo": 7, "imbécil": 6, "estúpido": 6,
        "idiota": 6, "pendejo": 6, "culero": 7, "pinche": 5, "puto": 7, // 'puto' como adjetivo o insulto
        // Baja Toxicidad (suman, pero necesitan acumulación o intensificadores)
        "tonto": 3, "feo": 3, "asco": 4, "odio": 4, "fastidio": 3, "molesto": 3
    };

    // Intensificadores: multiplican la puntuación del término tóxico al que afectan
    const intensifiers = {
        "muy": 1.5, "mucho":1.5, "demasiado": 1.7, "extremadamente": 2.0, "terriblemente": 1.8,
        "jodidamente": 2.0, "putamente": 2.0, "bastante": 1.3, "super": 1.5, "mega": 1.6,
        "un montón de": 1.5 // ej. "un montón de mierda"
    };

    // Mitigadores: reducen la puntuación del término tóxico al que afectan
    const mitigators = {
        "poco": 0.5, "un poco": 0.5, "algo": 0.7, "quizás": 0.6, "tal vez": 0.6,
        "relativamente": 0.7, "no tan": 0.4, "no mucho": 0.4
    };

    // Palabras de negación: pueden anular la puntuación de un término si están directamente asociadas
    const negationWords = ["no", "ni", "nunca", "jamás", "tampoco", "para nada", "de ninguna manera"];

    // Contextos benignos: si un término tóxico aparece en estos contextos, su puntuación se reduce/anula
    // La clave es el término de contexto, el valor es un factor de reducción (0 anula)
    const benignContextFactors = {
        "humor": 0.1, "chiste": 0.1, "broma": 0.1, // ej. "humor negro"
        "color": 0.0, "televisor": 0.0, "coche": 0.0, "ropa": 0.0, "libro": 0.0,
        "arte": 0.0, "pintura": 0.0, "película": 0.2, "canción": 0.2, "personaje": 0.2, // ej. "personaje dice X"
        "no es": 0.0, "no era": 0.0, "no soy": 0.0, "no eres": 0.0, // Negación directa de identidad
        "contexto histórico": 0.1, "cita de": 0.1
    };

    // --- Lógica de Análisis ---

    // 1. Tokenización simple (puede no ser ideal para frases complejas, pero es un inicio)
    // Para una mejor detección de frases, iteraremos sobre el string original buscando substrings.

    let processedComment = lowerCaseComment;

    // Aplicar puntuación de términos directos
    for (const term in directScoreTerms) {
        let termOccurrences = 0;
        let searchStartIndex = 0;
        while(processedComment.indexOf(term, searchStartIndex) !== -1) {
            const termIndex = processedComment.indexOf(term, searchStartIndex);
            termOccurrences++;
            searchStartIndex = termIndex + term.length; // Continuar búsqueda después del término encontrado

            let currentScore = directScoreTerms[term];
            let modifierFactor = 1.0;
            let isNegatedOrBenign = false;

            // a. Verificar negación simple (ej. "no [término]")
            // Busca la negación justo antes del término.
            const textBeforeTerm = processedComment.substring(Math.max(0, termIndex - 10), termIndex).trim(); // 10 chars antes
            for (const neg of negationWords) {
                if (textBeforeTerm.endsWith(neg)) {
                    modifierFactor = 0.1; // Reduce drásticamente la puntuación
                    isNegatedOrBenign = true;
                    console.log(`Term '${term}' found with negation '${neg}'. Factor: ${modifierFactor}`);
                    break;
                }
            }

            // b. Verificar contexto benigno (ej. "humor [término]", "[término] de color")
            // Busca palabras de contexto benigno alrededor del término.
            if (!isNegatedOrBenign) {
                const windowSize = 20; // Caracteres alrededor del término
                const textAroundTerm = processedComment.substring(Math.max(0, termIndex - windowSize), Math.min(processedComment.length, termIndex + term.length + windowSize));
                for (const context in benignContextFactors) {
                    if (textAroundTerm.includes(context)) {
                         // Si el contexto es parte del término ofensivo en sí, no lo consideramos benigno
                        if (term.includes(context)) continue;
                        modifierFactor = benignContextFactors[context];
                        isNegatedOrBenign = true;
                        console.log(`Term '${term}' found with benign context '${context}'. Factor: ${modifierFactor}`);
                        break;
                    }
                }
            }

            currentScore *= modifierFactor; // Aplicar factor de negación/contexto benigno

            // c. Aplicar intensificadores/mitigadores
            // Busca intensificadores/mitigadores justo antes del término.
            // Esta es una lógica simplificada; idealmente se analizaría la estructura de la frase.
            if (modifierFactor > 0.1) { // No aplicar si ya está fuertemente mitigado/negado
                const wordsBefore = textBeforeTerm.split(/\s+/);
                const wordImmediatelyBefore = wordsBefore.pop(); // Última palabra antes del término

                if (intensifiers[wordImmediatelyBefore]) {
                    currentScore *= intensifiers[wordImmediatelyBefore];
                    console.log(`Intensifier '${wordImmediatelyBefore}' applied to '${term}'. New score contrib: ${currentScore - (directScoreTerms[term] * modifierFactor)}`);
                } else if (mitigators[wordImmediatelyBefore]) {
                    currentScore *= mitigators[wordImmediatelyBefore];
                    console.log(`Mitigator '${wordImmediatelyBefore}' applied to '${term}'. New score contrib: ${currentScore - (directScoreTerms[term] * modifierFactor)}`);
                }
            }

            toxicityScore += currentScore;
            console.log(`Term: '${term}', Base: ${directScoreTerms[term]}, Modified Score Added: ${currentScore.toFixed(2)}, Total Score: ${toxicityScore.toFixed(2)}`);

            if (toxicityScore >= TOXICITY_THRESHOLD) {
                console.log(`Threshold (${TOXICITY_THRESHOLD}) reached. Comment is offensive.`);
                return true;
            }
        }
    }

    console.log(`Final Toxicity Score: ${toxicityScore.toFixed(2)} (Threshold: ${TOXICITY_THRESHOLD})`);
    return toxicityScore >= TOXICITY_THRESHOLD;
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
