export const SUPPORTED_CITIES = [
  'bangalore',
  'mumbai',
  'pune',
  'delhi',
  'hyderabad',
  'chennai',
  'ahmedabad',
] as const;

export type City = (typeof SUPPORTED_CITIES)[number];

export const CITY_DISPLAY_NAMES: Record<string, string> = {
  bangalore: 'Bangalore',
  mumbai: 'Mumbai',
  pune: 'Pune',
  delhi: 'Delhi',
  hyderabad: 'Hyderabad',
  chennai: 'Chennai',
  ahmedabad: 'Ahmedabad',
};
