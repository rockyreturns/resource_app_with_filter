export const readFilters = async () => {
  const response = await fetch('filters.json');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const saveFilters = async (filters) => {
  return new Promise((resolve) => {
    const jsonString = JSON.stringify(filters);
    const file = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = 'filters.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    resolve();
  });
};
