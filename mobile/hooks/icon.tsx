import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

export const icon = {
  Beranda: (props: any) => <Entypo name="home" size={20} {...props} />,
  KualitasAir: (props: any) => (
    <MaterialCommunityIcons name="water" size={20} {...props} />
  ),
  Akun: (props: any) => <FontAwesome5 name="user-alt" size={20} {...props} />,
};
