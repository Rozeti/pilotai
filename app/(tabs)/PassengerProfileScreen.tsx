import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Car,
  Star,
  Clock,
  Shield,
  FileText,
  Edit2,
  Save,
  X,
  ChevronRight,
  Home,
  Briefcase,
  Bell,
  LogOut,
  Settings,
  Calendar, // ADICIONADO
} from 'lucide-react-native';

// === CORES ===
const COLORS = {
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  mediumGray: '#C9C3C3',
  darkGray: '#909090',
  black: '#141414',
  primary: '#6E17EB',
  success: '#34A853',
  danger: '#EA4335',
  warning: '#FBBC05',
};

// === DADOS MOCK ===
const MOCK_USER_DATA = {
  name: 'João Silva',
  email: 'joao.silva@email.com',
  phone: '(11) 98765-4321',
  cpf: '123.456.789-00',
  cnh: '98765432100',
  cnhStatus: 'válida',
  birthdate: '15/03/1990',
  address: 'Rua Augusta, 500 - Consolação, São Paulo - SP',
  rating: 4.8,
  totalRides: 127,
  memberSince: 'Março 2023',
};

const MOCK_VEHICLE_DATA = {
  plate: 'ABC-1234',
  brand: 'Toyota',
  model: 'Corolla',
  year: '2020',
  color: 'Prata',
};

const MOCK_FAVORITES = [
  { id: '1', name: 'Casa', address: 'Rua das Flores, 123', icon: Home },
  { id: '2', name: 'Trabalho', address: 'Av. Paulista, 1000', icon: Briefcase },
];

const MOCK_HISTORY = [
  { id: '1', date: '20/10/2024', from: 'Casa', to: 'Trabalho', price: 'R$ 25,00', rating: 5 },
  { id: '2', date: '19/10/2024', from: 'Shopping', to: 'Casa', price: 'R$ 32,50', rating: 5 },
  { id: '3', date: '18/10/2024', from: 'Trabalho', to: 'Academia', price: 'R$ 18,00', rating: 4 },
];

export default function PassengerProfileScreen() {
  const insets = useSafeAreaInsets();

  // === MODAIS ===
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [editedData, setEditedData] = useState(MOCK_USER_DATA);
  const [editedVehicle, setEditedVehicle] = useState(MOCK_VEHICLE_DATA);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // === SALVAR ===
  const handleSaveProfile = () => {
    console.log('Salvando perfil:', editedData);
    setShowEditModal(false);
    Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
  };

  const handleSaveVehicle = () => {
    console.log('Salvando veículo:', editedVehicle);
    setShowVehicleModal(false);
    Alert.alert('Sucesso', 'Veículo atualizado com sucesso!');
  };

  const handleLogout = () => {
    Alert.alert('Sair da Conta', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => console.log('Logout') },
    ]);
  };

  const openSettings = () => {
    setShowSettingsModal(true);
  };

  return (
    <>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => console.log('Voltar')}>
          <ArrowLeft color={COLORS.black} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <View style={styles.backButton} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* CARD DO PERFIL */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <User color={COLORS.primary} size={40} />
              </View>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Edit2 color={COLORS.white} size={16} />
              </TouchableOpacity>
            </View>

            <Text style={styles.profileName}>{editedData.name}</Text>
            <Text style={styles.profileEmail}>{editedData.email}</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Star color={COLORS.warning} size={24} fill={COLORS.warning} />
                <Text style={styles.statValue}>{editedData.rating}</Text>
                <Text style={styles.statLabel}>Avaliação</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Car color={COLORS.primary} size={24} />
                <Text style={styles.statValue}>{editedData.totalRides}</Text>
                <Text style={styles.statLabel}>Viagens</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Clock color={COLORS.success} size={24} />
                <Text style={styles.statValue}>{editedData.memberSince}</Text>
                <Text style={styles.statLabel}>Membro desde</Text>
              </View>
            </View>

            {/* CNH */}
            <View style={styles.cnhContainer}>
              <FileText color={COLORS.primary} size={18} />
              <Text style={styles.cnhText}>CNH: {editedData.cnh}</Text>
              <View style={[styles.cnhStatus, editedData.cnhStatus === 'válida' ? styles.cnhValid : styles.cnhInvalid]}>
                <Text style={styles.cnhStatusText}>{editedData.cnhStatus}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.editProfileButton} onPress={() => setShowEditModal(true)}>
              <Edit2 color={COLORS.primary} size={18} />
              <Text style={styles.editProfileButtonText}>Editar Perfil</Text>
            </TouchableOpacity>
          </View>

          {/* MEUS DADOS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meus Dados</Text>

            <View style={styles.infoItem}>
              <User color={COLORS.primary} size={20} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Nome</Text>
                <Text style={styles.infoValue}>{editedData.name}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <FileText color={COLORS.darkGray} size={20} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>CPF</Text>
                <Text style={styles.infoValue}>{editedData.cpf}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Calendar color={COLORS.darkGray} size={20} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Nascimento</Text>
                <Text style={styles.infoValue}>{editedData.birthdate}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Phone color={COLORS.success} size={20} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Telefone</Text>
                <Text style={styles.infoValue}>{editedData.phone}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <MapPin color={COLORS.warning} size={20} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Endereço</Text>
                <Text style={styles.infoValue}>{editedData.address}</Text>
              </View>
            </View>
          </View>

          {/* MEU VEÍCULO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meu Veículo</Text>
            <View style={styles.vehicleCard}>
              <View style={styles.vehicleHeader}>
                <Car color={COLORS.primary} size={28} />
                <View style={styles.vehiclePlate}>
                  <Text style={styles.vehiclePlateText}>{editedVehicle.plate}</Text>
                </View>
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleModel}>
                  {editedVehicle.brand} {editedVehicle.model} | {editedVehicle.year}
                </Text>
                <Text style={styles.vehicleColor}>Cor: {editedVehicle.color}</Text>
              </View>
              <TouchableOpacity style={styles.editVehicleButton} onPress={() => setShowVehicleModal(true)}>
                <Edit2 color={COLORS.primary} size={16} />
                <Text style={styles.editVehicleButtonText}>Editar Veículo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FAVORITOS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lugares Favoritos</Text>
            {MOCK_FAVORITES.map((fav) => (
              <View key={fav.id} style={styles.favoriteItem}>
                <View style={[styles.favoriteIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
                  <fav.icon color={COLORS.primary} size={20} />
                </View>
                <View style={styles.favoriteText}>
                  <Text style={styles.favoriteName}>{fav.name}</Text>
                  <Text style={styles.favoriteAddress}>{fav.address}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addFavoriteButton}>
              <Text style={styles.addFavoriteText}>+ Adicionar Novo Favorito</Text>
            </TouchableOpacity>
          </View>

          {/* HISTÓRICO */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Histórico Recente</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Ver Tudo</Text>
              </TouchableOpacity>
            </View>
            {MOCK_HISTORY.map((ride) => (
              <View key={ride.id} style={styles.historyItem}>
                <View style={styles.historyIconContainer}>
                  <Car color={COLORS.white} size={18} />
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyDate}>{ride.date}</Text>
                  <Text style={styles.historyRoute}>{ride.from} → {ride.to}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyPrice}>{ride.price}</Text>
                  <View style={styles.historyRating}>
                    <Star color={COLORS.warning} size={14} fill={COLORS.warning} />
                    <Text style={styles.historyRatingText}>{ride.rating}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* MENU PRINCIPAL */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.menuItem} onPress={openSettings}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
                  <Settings color={COLORS.primary} size={22} />
                </View>
                <Text style={styles.menuItemTitle}>Configurações</Text>
              </View>
              <ChevronRight color={COLORS.darkGray} size={20} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconContainer, { backgroundColor: COLORS.danger + '15' }]}>
                  <Shield color={COLORS.danger} size={22} />
                </View>
                <Text style={styles.menuItemTitle}>Privacidade e Segurança</Text>
              </View>
              <ChevronRight color={COLORS.darkGray} size={20} />
            </TouchableOpacity>
          </View>

          {/* SAIR */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut color={COLORS.danger} size={22} />
            <Text style={styles.logoutButtonText}>Sair da Conta</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Pilotaí v1.0.0</Text>
            <Text style={styles.footerSubtext}>© 2024 Todos os direitos reservados</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* MODAL: EDITAR PERFIL */}
      <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X color={COLORS.black} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome Completo</Text>
                <TextInput
                  style={styles.input}
                  value={editedData.name}
                  onChangeText={(t) => setEditedData({ ...editedData, name: t })}
                  placeholder="Seu nome completo"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  value={editedData.email}
                  onChangeText={(t) => setEditedData({ ...editedData, email: t })}
                  keyboardType="email-address"
                  placeholder="seu@email.com"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  value={editedData.phone}
                  onChangeText={(t) => setEditedData({ ...editedData, phone: t })}
                  keyboardType="phone-pad"
                  placeholder="(00) 00000-0000"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Endereço</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editedData.address}
                  onChangeText={(t) => setEditedData({ ...editedData, address: t })}
                  multiline
                  placeholder="Seu endereço completo"
                />
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                <Save color={COLORS.white} size={20} />
                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: EDITAR VEÍCULO */}
      <Modal visible={showVehicleModal} animationType="slide" transparent onRequestClose={() => setShowVehicleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Veículo</Text>
              <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                <X color={COLORS.black} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Placa</Text>
                <TextInput
                  style={styles.input}
                  value={editedVehicle.plate}
                  onChangeText={(t) => setEditedVehicle({ ...editedVehicle, plate: t })}
                  placeholder="ABC-1234"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Marca</Text>
                <TextInput
                  style={styles.input}
                  value={editedVehicle.brand}
                  onChangeText={(t) => setEditedVehicle({ ...editedVehicle, brand: t })}
                  placeholder="Ex: Toyota, Honda, Fiat"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Modelo</Text>
                <TextInput
                  style={styles.input}
                  value={editedVehicle.model}
                  onChangeText={(t) => setEditedVehicle({ ...editedVehicle, model: t })}
                  placeholder="Ex: Corolla, Civic, Uno"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ano</Text>
                <TextInput
                  style={styles.input}
                  value={editedVehicle.year}
                  onChangeText={(t) => setEditedVehicle({ ...editedVehicle, year: t })}
                  keyboardType="numeric"
                  placeholder="2020"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cor</Text>
                <TextInput
                  style={styles.input}
                  value={editedVehicle.color}
                  onChangeText={(t) => setEditedVehicle({ ...editedVehicle, color: t })}
                  placeholder="Ex: Preto, Branco, Prata"
                />
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveVehicle}>
                <Save color={COLORS.white} size={20} />
                <Text style={styles.saveButtonText}>Salvar Veículo</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: CONFIGURAÇÕES */}
      <Modal visible={showSettingsModal} animationType="slide" transparent onRequestClose={() => setShowSettingsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurações</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <X color={COLORS.black} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Bell color={COLORS.warning} size={22} />
                  <Text style={styles.settingTitle}>Notificações</Text>
                </View>
                <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
              </View>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MapPin color={COLORS.success} size={22} />
                  <Text style={styles.settingTitle}>Localização</Text>
                </View>
                <Switch value={locationEnabled} onValueChange={setLocationEnabled} />
              </View>
              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Shield color={COLORS.primary} size={22} />
                  <Text style={styles.settingTitle}>Privacidade e Segurança</Text>
                </View>
                <ChevronRight color={COLORS.darkGray} size={20} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// === ESTILOS ===
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    zIndex: 1000,
  },
  backButton: { padding: 4, width: 32 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.black },
  safeArea: { flex: 1, backgroundColor: COLORS.lightGray },
  container: { flex: 1 },
  profileCard: { backgroundColor: COLORS.white, padding: 24, alignItems: 'center', marginBottom: 12 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary + '30',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileName: { fontSize: 22, fontWeight: 'bold', color: COLORS.black, marginBottom: 4 },
  profileEmail: { fontSize: 15, color: COLORS.darkGray, marginBottom: 20 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginTop: 4 },
  statLabel: { fontSize: 12, color: COLORS.darkGray },
  statDivider: { width: 1, backgroundColor: COLORS.mediumGray },
  cnhContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  cnhText: { fontSize: 14, color: COLORS.black, fontWeight: '600' },
  cnhStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  cnhValid: { backgroundColor: COLORS.success + '20' },
  cnhInvalid: { backgroundColor: COLORS.danger + '20' },
  cnhStatusText: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editProfileButtonText: { color: COLORS.primary, fontWeight: '600' },
  section: { backgroundColor: COLORS.white, marginBottom: 12, paddingHorizontal: 20, paddingVertical: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginBottom: 12, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAllText: { color: COLORS.primary, fontWeight: '600' },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  infoText: { marginLeft: 16, flex: 1 },
  infoLabel: { fontSize: 14, color: COLORS.darkGray },
  infoValue: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginTop: 2 },
  vehicleCard: { padding: 16, backgroundColor: COLORS.lightGray, borderRadius: 12 },
  vehicleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  vehiclePlate: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  vehiclePlateText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  vehicleInfo: { marginLeft: 40, marginBottom: 12 },
  vehicleModel: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  vehicleColor: { fontSize: 14, color: COLORS.darkGray, marginTop: 2 },
  editVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editVehicleButtonText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  favoriteIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favoriteText: { flex: 1 },
  favoriteName: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  favoriteAddress: { fontSize: 14, color: COLORS.darkGray },
  addFavoriteButton: { paddingHorizontal: 12, paddingVertical: 6, marginTop: 8 },
  addFavoriteText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  historyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyDetails: { flex: 1 },
  historyDate: { fontSize: 14, color: COLORS.darkGray },
  historyRoute: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  historyRight: { alignItems: 'flex-end' },
  historyPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
  historyRating: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  historyRatingText: { fontSize: 13, color: COLORS.darkGray, marginLeft: 4 },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginVertical: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.danger + '30',
  },
  logoutButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.danger },
  footer: { alignItems: 'center', paddingVertical: 20, paddingBottom: 40 },
  footerText: { fontSize: 14, fontWeight: '600', color: COLORS.darkGray },
  footerSubtext: { fontSize: 12, color: COLORS.mediumGray, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
  modalScroll: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: COLORS.white,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black },
});