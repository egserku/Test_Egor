
export const COLORS = [
  { name: 'Белый', hex: '#FFFFFF' },
  { name: 'Чёрный', hex: '#000000' },
  { name: 'Тёмно синий / Navy', hex: '#001F3F' },
  { name: 'Тёмно зелёный', hex: '#004D00' },
  { name: 'Royal', hex: '#4169E1' },
  { name: 'Бирюзовый / Turquoise', hex: '#40E0D0' },
  { name: 'Оранжевый', hex: '#FF8C00' },
  { name: 'Красный', hex: '#FF0000' },
  { name: 'Фуксия', hex: '#FF00FF' },
];

export const SCHOOL_SIZES_KIDS = ['6', '8', '10', '12', '14', '16', '18'];
export const SCHOOL_SIZES_ADULTS = ['S', 'M', 'L', 'XL', '2XL'];

export const PERSONAL_SIZES_KIDS = ['2', '4', '6', '8', '10', '12', '14', '16', '18'];
export const PERSONAL_SIZES_ADULTS = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

export const TEAM_SIZES_KIDS = ['10', '12', '14', '16', '18'];
export const TEAM_SIZES_ADULTS = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

export const SLEEVES = {
  BOY: ['Короткий', 'Длинный'],
  GIRL: ['Короткий', 'Длинный', '3/4']
};

export const PRINT_PLACES = ['Спереди', 'Сзади', 'Левый рукав', 'Правый рукав'];

export interface School {
  id: string;
  name: string;
  logo: string;
}

export const SCHOOL_LIST: School[] = [
  { id: '1', name: 'Школа №1', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=school1&backgroundColor=b6e3f4' },
  { id: '2', name: 'Лицей №15', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=lyceum15&backgroundColor=c0aede' },
  { id: '3', name: 'Гимназия №3', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=gym3&backgroundColor=d1d4f9' },
  { id: '4', name: 'Школа Искусств', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=arts&backgroundColor=ffd5dc' },
  { id: '5', name: "Спортивная школа 'Олимп'", logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=olymp&backgroundColor=ffdfbf' },
  { id: '6', name: 'Школа №100', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=sch100&backgroundColor=c0f2ff' },
  { id: '7', name: 'МБОУ СОШ №42', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=sch42&backgroundColor=e0f7fa' },
  { id: '8', name: 'Президентский лицей', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=pres&backgroundColor=f3e5f5' },
  { id: '9', name: 'Технический Колледж', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=tech&backgroundColor=e8f5e9' },
  { id: '10', name: 'Школа Будущего', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=future&backgroundColor=fff3e0' },
];
