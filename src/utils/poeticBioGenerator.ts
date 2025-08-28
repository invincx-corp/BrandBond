// Utility function to generate poetic descriptions from All Time Favorites
// This can be used across the entire app for consistent bio generation

export interface FavoriteItem {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface FavoritesData {
  [category: string]: FavoriteItem[];
}

export const generatePoeticDescription = (favoritesData: FavoritesData, favoriteCategories: string[]) => {
  const descriptions: string[] = [];
  
  favoriteCategories.forEach(category => {
    const favorites = favoritesData[category] || [];
    if (favorites.length > 0) {
      const favorite = favorites[0];
      
      // Create poetic descriptions for each category
      switch (category) {
        case 'Fav Singers':
          descriptions.push(`finds rhythm in ${favorite.name}'s melodies`);
          break;
        case 'Fav Songs':
          descriptions.push(`gets lost in the magic of "${favorite.name}"`);
          break;
        case 'Fav Music Categories':
          descriptions.push(`dances to the beat of ${favorite.name}`);
          break;
        case 'Fav Music Composers':
          descriptions.push(`appreciates the genius of ${favorite.name}`);
          break;
        case 'Fav Songwriters':
          descriptions.push(`connects with ${favorite.name}'s storytelling`);
          break;
        case 'Fav Music Bands':
          descriptions.push(`rocks out to ${favorite.name}'s energy`);
          break;
        case 'Fav Idols':
          descriptions.push(`looks up to ${favorite.name}'s talent`);
          break;
        case 'Fav Singer Groups':
          descriptions.push(`sings along to ${favorite.name}'s harmonies`);
          break;
        case 'Fav Movies':
          descriptions.push(`gets swept away by ${favorite.name}'s cinematic magic`);
          break;
        case 'Fav Movie Categories':
          descriptions.push(`loses themselves in ${favorite.name} films`);
          break;
        case 'Fav TV Series':
          descriptions.push(`binge-watches ${favorite.name} with passion`);
          break;
        case 'Fav TV Series Categories':
          descriptions.push(`enjoys ${favorite.name} television`);
          break;
        case 'Fav Books':
          descriptions.push(`discovers wisdom in ${favorite.name}'s pages`);
          break;
        case 'Fav Book Categories':
          descriptions.push(`explores ${favorite.name} literature`);
          break;
        case 'Fav Cartoons':
          descriptions.push(`finds joy in ${favorite.name}'s animation`);
          break;
        case 'Fav Comics':
          descriptions.push(`dives into ${favorite.name}'s adventures`);
          break;
        case 'Fav Actors':
          descriptions.push(`admires ${favorite.name}'s performances`);
          break;
        case 'Fav Sports':
          descriptions.push(`finds passion in ${favorite.name}'s energy`);
          break;
        case 'Fav Athletes':
          descriptions.push(`looks up to ${favorite.name}'s dedication`);
          break;
        case 'Fav Travel Destinations':
          descriptions.push(`dreams of ${favorite.name} adventures`);
          break;
        case 'Fav Travel Destination Categories':
          descriptions.push(`explores ${favorite.name} destinations`);
          break;
        case 'Fav Food/Cuisine':
          descriptions.push(`savors the flavors of ${favorite.name}`);
          break;
        case 'Fav Food/Cuisine Categories':
          descriptions.push(`enjoys ${favorite.name} cuisine`);
          break;
        case 'Fav Shopping Brands':
          descriptions.push(`trusts ${favorite.name} quality`);
          break;
        case 'Fav Tech Gadgets':
          descriptions.push(`embraces the future with ${favorite.name}`);
          break;
        case 'Fav Hobbies':
          descriptions.push(`finds joy in ${favorite.name}`);
          break;
        case 'Fav Interests':
          descriptions.push(`explores ${favorite.name} with curiosity`);
          break;
        case 'Fav Habits':
          descriptions.push(`maintains ${favorite.name} as a daily practice`);
          break;
        case 'Fav Animals':
          descriptions.push(`shares life with loyal ${favorite.name}`);
          break;
        default:
          descriptions.push(`loves ${favorite.name}`);
      }
    }
  });
  
  if (descriptions.length === 0) {
    return "A soul with diverse passions and unique tastes that make them truly special.";
  }
  
  // Combine descriptions poetically
  const firstPart = descriptions.slice(0, -1).join(', ');
  const lastPart = descriptions[descriptions.length - 1];
  
  return `A soul who ${firstPart}, and ${lastPart}.`;
};

// Default favorite categories that should be used across the app
export const defaultFavoriteCategories = [
  'Fav Singers',
  'Fav Songs',
  'Fav Music Categories',
  'Fav Music Composers',
  'Fav Songwriters',
  'Fav Music Bands',
  'Fav Idols',
  'Fav Singer Groups',
  'Fav Movies',
  'Fav Movie Categories',
  'Fav TV Series',
  'Fav TV Series Categories',
  'Fav Books',
  'Fav Book Categories',
  'Fav Cartoons',
  'Fav Comics',
  'Fav Actors',
  'Fav Sports',
  'Fav Athletes',
  'Fav Travel Destinations',
  'Fav Travel Destination Categories',
  'Fav Food/Cuisine',
  'Fav Food/Cuisine Categories',
  'Fav Shopping Brands',
  'Fav Tech Gadgets',
  'Fav Hobbies',
  'Fav Interests',
  'Fav Habits',
  'Fav Animals'
];
