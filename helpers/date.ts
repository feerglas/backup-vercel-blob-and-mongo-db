export const dateString = (): string => {
  const date = new Date();
  const year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date);
  const month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(date);
  const day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date);
  const hours = new Intl.DateTimeFormat('de', {
      timeStyle: 'short',
    }).format(date);
  
  return `${year}${month}${day}-${hours.replace(':', '')}`;
}

// todo: type buckets
export const sortBucketsNewestFirst = (buckets) => {
  const sorted = buckets.sort((a, b) => b.CreationDate.getTime() - a.CreationDate.getTime());

  return sorted;

};
