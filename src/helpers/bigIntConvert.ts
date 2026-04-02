export const idAsBigInt = (nodeId) => {
    // Если уже BigInt — возвращаем
    if (typeof nodeId === 'bigint') return nodeId;
    
    // Если строка — удаляем 'n' в конце, если есть
    if (typeof nodeId === 'string') {
        const cleanStr = nodeId.endsWith('n') ? nodeId.slice(0, -1) : nodeId;
        return BigInt(cleanStr);
    }
    
    // Для чисел и всего остального
    return BigInt(nodeId);
};