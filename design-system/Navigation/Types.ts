export interface User {
    first_name?: string;          // if the user updated it after registration     
    profile_picture?: string;
  }
  
  export interface Home {
    id: number;
    name: string;
    
  }
  
  export interface TopNavigationProps {
  user: User;
  homes: Home[];
  activeHomeId?: number;
  onHomeSelect: (homeId: number) => void;
  onAddHome: () => void;
  onAddMember?: () => void;
  onNotificationPress?: () => void;
}
  
  
  export interface BottomNavigationItem {
    key: string;
    label: string;
    icon: React.ReactNode;
  }
  
  export interface BottomNavigationProps {
    items: BottomNavigationItem[];
    activeKey: string;
    profile_picture?: string;
    onTabPress: (key: string) => void;
  }
  