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
import { useNavigation } from '@react-navigation/native'; // ← ADICIONADO
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Star,
  Clock,
  Bell,
  Shield,
  LogOut,
  Edit2,
  Save,
  X,
  ChevronRight,
  Home,
  Briefcase,
  Settings,
  FileText,
  Calendar,
  DollarSign,
  ClipboardList,
  TrendingUp,
  LifeBuoy,
  Banknote,
  CheckCircle2,
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
const MOCK_DRIVER_DATA = {
  name: 'Carlos Oliveira',
  email: 'carlos.motorista@email.com',
  phone: '(11) 99876-5432',
  cpf: '987.654.321-00',
  birthdate: '22/07/1985',
  address: 'Rua das Acácias, 789 - Jardim Europa, São Paulo - SP',
  rating: 4.9,
  totalRides: 842,
  memberSince: 'Janeiro 2022',
  license: '123456789',
  verified: true,
};

const MOCK_WALLET_DATA = {
  balance: 'R$ 287,50',
  nextPayout: '05/11/2024',
  bank: 'Banco X (Ag: 0001, C/C: 123456-7)',
};

const MOCK_DOCUMENTS_DATA = {
  cnh: { status: 'Válida', expiry: '10/2026' },
  backgroundCheck: { status: 'Aprovado', date: '01/2024' },
};

const MOCK_FAVORITES = [
  { id: '1', name: 'Casa', address: 'Rua das Flores, 123', icon: Home },
  { id: '2', name: 'Academia', address: 'Av. Rebouças, 1500', icon: Briefcase },
];

const MOCK_HISTORY = [
  { id: '1', date: '20/10/2024', from: 'Casa', to: 'Aeroporto', price: 'R$ 85,00', rating: 5 },
  { id: '2', date: '19/10/2024', from: 'Shopping', to: 'Casa', price: 'R$ 42,00', rating: 5 },
];

export default function DriverProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>(); // ← NAVEGAÇÃO ATIVA

  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const [editedData, setEditedData] = useState(MOCK_DRIVER_DATA);

  const handleSaveProfile = () => {
    Object.assign(MOCK_DRIVER_DATA, editedData);
    setShowEditModal(false);
    Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
  };

  // BOTÃO VOLTAR → VAI PARA A TELA INICIAL DO MOTORISTA
  const handleBackPress = () => {
    navigation.navigate('DriverHomeScreen');
  };

  // BOTÃO SAIR → CONFIRMA E VAI PARA O LOGIN (igual ao passageiro)
  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'index' }], // ← mesma tela de login do passageiro
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderMenuItem = ({
    icon: Icon,
    title,
    onPress,
    color = COLORS.black,
  }: {
    icon: React.ElementType,
    title: string,
    onPress: () => void,
    color?: string,
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconContainer, { backgroundColor: color + '15' }]}>
          <Icon color={color} size={22} />
        </View>
        <Text style={styles.menuItemTitle}>{title}</Text>
      </View>
      <ChevronRight color={COLORS.darkGray} size={20} />
    </TouchableOpacity>
  );

  // === MODAIS (mantidos iguais) ===
  const renderEditProfileModal = () => (
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
              <TextInput style={styles.input} value={editedData.name} onChangeText={(t) => setEditedData({ ...editedData, name: t })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>E-mail</Text>
              <TextInput style={styles.input} value={editedData.email} onChangeText={(t) => setEditedData({ ...editedData, email: t })} keyboardType="email-address" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Telefone</Text>
              <TextInput style={styles.input} value={editedData.phone} onChangeText={(t) => setEditedData({ ...editedData, phone: t })} keyboardType="phone-pad" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Endereço</Text>
              <TextInput style={[styles.input, styles.textArea]} value={editedData.address} onChangeText={(t) => setEditedData({ ...editedData, address: t })} multiline />
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Save color={COLORS.white} size={20} />
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderSettingsModal = () => (
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
              <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: COLORS.mediumGray, true: COLORS.primary }} />
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <MapPin color={COLORS.success} size={22} />
                <Text style={styles.settingTitle}>Localização</Text>
              </View>
              <Switch value={locationEnabled} onValueChange={setLocationEnabled} trackColor={{ false: COLORS.mediumGray, true: COLORS.primary }} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderWalletModal = () => (
    <Modal visible={showWalletModal} animationType="slide" transparent onRequestClose={() => setShowWalletModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ganhos e Repasses</Text>
            <TouchableOpacity onPress={() => setShowWalletModal(false)}>
              <X color={COLORS.black} size={24} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.walletBalanceCard}>
              <Text style={styles.walletLabel}>Saldo Atual</Text>
              <Text style={styles.walletBalance}>{MOCK_WALLET_DATA.balance}</Text>
              <TouchableOpacity style={styles.walletPayoutButton}>
                <Text style={styles.walletPayoutButtonText}>Solicitar Repasse</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoItem}>
              <Clock color={COLORS.primary} size={20} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Próximo Repasse Programado</Text>
                <Text style={styles.infoValue}>{MOCK_WALLET_DATA.nextPayout}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Banknote color={COLORS.success} size={20} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Conta Bancária</Text>
                <Text style={styles.infoValue}>{MOCK_WALLET_DATA.bank}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderDocumentsModal = () => (
    <Modal visible={showDocumentsModal} animationType="slide" transparent onRequestClose={() => setShowDocumentsModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Meus Documentos</Text>
            <TouchableOpacity onPress={() => setShowDocumentsModal(false)}>
              <X color={COLORS.black} size={24} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            <TouchableOpacity style={styles.documentItem}>
              <View style={styles.documentLeft}>
                <FileText color={COLORS.primary} size={22} />
                <View style={styles.infoText}>
                  <Text style={styles.documentTitle}>CNH (Carteira de Motorista)</Text>
                  <Text style={styles.documentStatusValid}>{`Status: ${MOCK_DOCUMENTS_DATA.cnh.status} (Vence ${MOCK_DOCUMENTS_DATA.cnh.expiry})`}</Text>
                </View>
              </View>
              <ChevronRight color={COLORS.darkGray} size={20} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.documentItem}>
              <View style={styles.documentLeft}>
                <Shield color={COLORS.success} size={22} />
                <View style={styles.infoText}>
                  <Text style={styles.documentTitle}>Atestado de Antecedentes</Text>
                  <Text style={styles.documentStatusValid}>{`Status: ${MOCK_DOCUMENTS_DATA.backgroundCheck.status} (Válido desde ${MOCK_DOCUMENTS_DATA.backgroundCheck.date})`}</Text>
                </View>
              </View>
              <ChevronRight color={COLORS.darkGray} size={20} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      {/* HEADER COM BOTÃO DE VOLTAR CORRETO */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
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
                <Briefcase color={COLORS.primary} size={24} />
                <Text style={styles.statValue}>{editedData.totalRides}</Text>
                <Text style={styles.statLabel}>Corridas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Clock color={COLORS.success} size={24} />
                <Text style={styles.statValue}>{editedData.memberSince}</Text>
                <Text style={styles.statLabel}>Membro desde</Text>
              </View>
            </View>

            <View style={styles.verifiedBadge}>
              <CheckCircle2 color={COLORS.success} size={16} />
              <Text style={styles.verifiedText}>Motorista Verificado</Text>
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

          {/* LOCAIS FREQUENTES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Locais Frequentes</Text>
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
              <Text style={styles.addFavoriteText}>+ Adicionar Local Frequente</Text>
            </TouchableOpacity>
          </View>

          {/* HISTÓRICO RECENTE */}
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
                  <Briefcase color={COLORS.white} size={18} />
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyDate}>{ride.date}</Text>
                  <Text style={styles.historyRoute}>{`${ride.from} → ${ride.to}`}</Text>
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
            <Text style={styles.sectionTitle}>Menu Principal</Text>
            {renderMenuItem({ icon: DollarSign, title: 'Ganhos e Repasses', onPress: () => setShowWalletModal(true), color: COLORS.success })}
            {renderMenuItem({ icon: ClipboardList, title: 'Meus Documentos', onPress: () => setShowDocumentsModal(true), color: COLORS.primary })}
            {renderMenuItem({ icon: TrendingUp, title: 'Desempenho', onPress: () => Alert.alert('Desempenho', 'Em breve!'), color: COLORS.primary })}
            {renderMenuItem({ icon: Settings, title: 'Configurações do App', onPress: () => setShowSettingsModal(true), color: COLORS.darkGray })}
            {renderMenuItem({ icon: Shield, title: 'Privacidade e Segurança', onPress: () => {}, color: COLORS.danger })}
            {renderMenuItem({ icon: LifeBuoy, title: 'Ajuda e Suporte', onPress: () => Alert.alert('Suporte', 'Em breve!'), color: COLORS.warning })}
          </View>

          {/* BOTÃO SAIR DA CONTA */}
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

      {/* TODOS OS MODAIS */}
      {renderEditProfileModal()}
      {renderSettingsModal()}
      {renderWalletModal()}
      {renderDocumentsModal()}
    </>
  );
}

// === ESTILOS (100% mantidos) ===
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, zIndex: 1000 },
  backButton: { padding: 4, width: 32 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.black },
  safeArea: { flex: 1, backgroundColor: COLORS.lightGray },
  container: { flex: 1 },
  profileCard: { backgroundColor: COLORS.white, padding: 24, alignItems: 'center', marginBottom: 12 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.primary + '30' },
  editAvatarButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white },
  profileName: { fontSize: 22, fontWeight: 'bold', color: COLORS.black, marginBottom: 4 },
  profileEmail: { fontSize: 15, color: COLORS.darkGray, marginBottom: 20 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingVertical: 16, backgroundColor: COLORS.lightGray, borderRadius: 12, marginBottom: 16 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginTop: 4 },
  statLabel: { fontSize: 12, color: COLORS.darkGray },
  statDivider: { width: 1, backgroundColor: COLORS.mediumGray },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.success + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  verifiedText: { color: COLORS.success, fontWeight: '600', fontSize: 14 },
  editProfileButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary + '15', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  editProfileButtonText: { color: COLORS.primary, fontWeight: '600' },
  section: { backgroundColor: COLORS.white, marginBottom: 12, paddingHorizontal: 20, paddingVertical: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginBottom: 12, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAllText: { color: COLORS.primary, fontWeight: '600' },
  infoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  infoText: { marginLeft: 16, flex: 1 },
  infoLabel: { fontSize: 14, color: COLORS.darkGray },
  infoValue: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginTop: 2 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuItemTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  favoriteItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  favoriteIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  favoriteText: { flex: 1 },
  favoriteName: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  favoriteAddress: { fontSize: 14, color: COLORS.darkGray },
  addFavoriteButton: { paddingHorizontal: 12, paddingVertical: 6, marginTop: 8 },
  addFavoriteText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  historyIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historyDetails: { flex: 1 },
  historyDate: { fontSize: 14, color: COLORS.darkGray },
  historyRoute: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  historyRight: { alignItems: 'flex-end' },
  historyPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },
  historyRating: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  historyRatingText: { fontSize: 13, color: COLORS.darkGray, marginLeft: 4 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginHorizontal: 20, marginVertical: 24, paddingVertical: 16, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.danger + '30' },
  logoutButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.danger },
  footer: { alignItems: 'center', paddingVertical: 20, paddingBottom: 40 },
  footerText: { fontSize: 14, fontWeight: '600', color: COLORS.darkGray },
  footerSubtext: { fontSize: 12, color: COLORS.mediumGray, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
  modalScroll: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.black, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: COLORS.mediumGray, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: COLORS.white },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  saveButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  walletBalanceCard: { backgroundColor: COLORS.primary, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 24 },
  walletLabel: { fontSize: 16, color: COLORS.white + '90' },
  walletBalance: { fontSize: 32, fontWeight: 'bold', color: COLORS.white, marginVertical: 8 },
  walletPayoutButton: { backgroundColor: COLORS.white, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  walletPayoutButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: 'bold' },
  documentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  documentLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  documentTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  documentStatusValid: { fontSize: 14, color: COLORS.success, marginTop: 2 },
});