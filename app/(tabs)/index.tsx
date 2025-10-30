import 'react-native-gesture-handler';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import {
  ArrowRight,
  Calendar,
  Car,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  UserCircle,
} from 'lucide-react-native';
import { Svg, Path } from 'react-native-svg';

// Cores do projeto
const COLORS = {
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  mediumGray: '#C9C3C3',
  darkGray: '#909090',
  black: '#141414',
  primary: '#6E17EB',
};

/**
 * Função para formatar o número de telefone (xx) xxxxx-xxxx
 */
const formatPhone = (text: string) => {
  const digits = text.replace(/\D/g, '').slice(0, 11);
  let masked = '';
  if (digits.length > 0) masked = `(${digits.slice(0, 2)}`;
  if (digits.length >= 3)
    masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}`;
  if (digits.length >= 8)
    masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(
      7
    )}`;
  if (digits.length <= 2 && digits.length > 0) return `(${digits}`;
  return masked;
};

/**
 * Função para formatar o CEP XXXXX-XXX
 */
const formatCep = (text: string) => {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return digits;
};

/**
 * Componente IconInput (estável, fora do LoginScreen)
 */
const IconInput = ({
  icon: Icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  maxLength,
  secureTextEntry = false,
  editable = true,
  multiline = false,
}: any) => {
  const inputStyle = [
    styles.input,
    Icon ? styles.inputWithIconLeft : styles.inputWithoutIcon,
    multiline && styles.inputMultiline,
    !editable && { color: COLORS.darkGray },
  ];

  return (
    <View
      style={[
        styles.inputContainer,
        !editable && styles.inputDisabled,
        multiline && styles.inputContainerMultiline,
      ]}>
      {Icon && (
        <Icon
          color={COLORS.darkGray}
          size={20}
          style={[styles.inputIconLeft, multiline && { top: 18 }]}
        />
      )}
      <TextInput
        style={inputStyle}
        placeholder={placeholder}
        placeholderTextColor={COLORS.darkGray}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        maxLength={maxLength}
        editable={editable}
        multiline={multiline}
        autoCapitalize={
          keyboardType === 'default' ? 'sentences' : 'none'
        }
      />
    </View>
  );
};

export default function LoginScreen() {
  const [userType, setUserType] = useState('passenger');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    birthDate: '',
    cnh: '',
    cnhCategory: '',
    cnhExpiry: '',
    vehiclePlate: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    cep: '',
    address: '',
    numero: '',
    complemento: '',
    city: '',
    state: '',
  });

  const fetchCepData = async (cleanedCep: string) => {
    if (cleanedCep.length !== 8) return;

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cleanedCep}/json/`
      );
      if (!response.ok) throw new Error('Erro ao buscar CEP');

      const data = await response.json();

      if (data.erro) {
        Alert.alert('Erro', 'CEP não encontrado.');
        setFormData((prev) => ({
          ...prev,
          address: '',
          city: '',
          state: '',
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          address: data.logradouro,
          city: data.localidade,
          state: data.uf,
        }));
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível buscar o CEP. Tente novamente.');
    }
  };

  const handleInputChange = (name: string, value: string) => {
    let finalValue = value;
    if (name === 'phone') {
      finalValue = formatPhone(value);
    } else if (name === 'cep') {
      finalValue = formatCep(value);
      const cleanedCep = finalValue.replace(/\D/g, '');
      if (cleanedCep.length === 8) {
        fetchCepData(cleanedCep);
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleSubmit = () => {
    console.log('Form submitted:', { userType, isLogin, formData });
    Alert.alert(
      `${isLogin ? 'Login' : 'Cadastro'} como ${
        userType === 'passenger' ? 'Passageiro' : 'Motorista'
      }`,
      `Email: ${formData.email}`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.mediumGray} />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        <View style={styles.innerContainer}>
          {/* Logo e Header */}
          <View style={styles.headerContainer}>
            <View style={styles.logoBackground}>
              <Car color={COLORS.white} size={40} />
            </View>
            {/* ATUALIZADO: Nome do App */}
            <Text style={styles.headerTitle}>Pilotaí</Text>
            <Text style={styles.headerSubtitle}>
              Sua solução de mobilidade segura
            </Text>
          </View>

          {/* Card Principal */}
          <View style={styles.card}>
            {/* ... (Seleção de Tipo de Usuário e Tabs Login/Cadastro - Sem alterações) ... */}
            <View style={styles.userTypeRow}>
              <TouchableOpacity
                onPress={() => setUserType('passenger')}
                style={[
                  styles.userTypeButton,
                  userType === 'passenger'
                    ? styles.userTypeButtonActive
                    : styles.userTypeButtonInactive,
                ]}>
                <UserCircle
                  color={userType === 'passenger' ? COLORS.white : COLORS.black}
                  size={24}
                />
                <Text
                  style={[
                    styles.userTypeButtonText,
                    userType === 'passenger'
                      ? styles.userTypeButtonTextActive
                      : styles.userTypeButtonTextInactive,
                  ]}>
                  Passageiro
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setUserType('driver')}
                style={[
                  styles.userTypeButton,
                  userType === 'driver'
                    ? styles.userTypeButtonActive
                    : styles.userTypeButtonInactive,
                ]}>
                <Car
                  color={userType === 'driver' ? COLORS.white : COLORS.black}
                  size={24}
                />
                <Text
                  style={[
                    styles.userTypeButtonText,
                    userType === 'driver'
                      ? styles.userTypeButtonTextActive
                      : styles.userTypeButtonTextInactive,
                  ]}>
                  Motorista
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabsContainer}>
              <TouchableOpacity
                onPress={() => setIsLogin(true)}
                style={[
                  styles.tabButton,
                  isLogin ? styles.tabButtonActive : styles.tabButtonInactive,
                ]}>
                <Text style={styles.tabButtonText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsLogin(false)}
                style={[
                  styles.tabButton,
                  !isLogin ? styles.tabButtonActive : styles.tabButtonInactive,
                ]}>
                <Text style={styles.tabButtonText}>Cadastro</Text>
              </TouchableOpacity>
            </View>

            {/* Formulário */}
            <View style={styles.formContainer}>
              {!isLogin && (
                <>
                  {/* ... (Dados Pessoais - Sem alterações) ... */}
                  <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Dados Pessoais</Text>
                    <View style={styles.gridRow}>
                      <View style={styles.gridCol}>
                        <Text style={styles.inputLabel}>Nome Completo *</Text>
                        <IconInput
                          value={formData.name}
                          onChangeText={(text: string) =>
                            handleInputChange('name', text)
                          }
                        />
                      </View>
                      <View style={styles.gridCol}>
                        <Text style={styles.inputLabel}>CPF *</Text>
                        <IconInput
                          placeholder="000.000.000-00"
                          value={formData.cpf}
                          onChangeText={(text: string) =>
                            handleInputChange('cpf', text)
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.gridCol}>
                        <Text style={styles.inputLabel}>
                          Data de Nascimento *
                        </Text>
                        <IconInput
                          icon={Calendar}
                          placeholder="AAAA-MM-DD"
                          value={formData.birthDate}
                          onChangeText={(text: string) =>
                            handleInputChange('birthDate', text)
                          }
                        />
                      </View>
                      <View style={styles.gridCol}>
                        <Text style={styles.inputLabel}>Telefone *</Text>
                        <IconInput
                          icon={Phone}
                          placeholder="(00) 00000-0000"
                          value={formData.phone}
                          onChangeText={(text: string) =>
                            handleInputChange('phone', text)
                          }
                          keyboardType="phone-pad"
                          maxLength={15}
                        />
                      </View>
                    </View>
                  </View>

                  {/* ... (Endereço - Sem alterações) ... */}
                  <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Endereço</Text>
                    <View style={styles.gridRow}>
                      <View style={styles.gridCol}>
                        <Text style={styles.inputLabel}>CEP *</Text>
                        <IconInput
                          icon={MapPin}
                          placeholder="00000-000"
                          value={formData.cep}
                          onChangeText={(text: string) =>
                            handleInputChange('cep', text)
                          }
                          keyboardType="numeric"
                          maxLength={9}
                        />
                      </View>
                      <View style={styles.gridCol}>
                        <Text style={styles.inputLabel}>Rua *</Text>
                        <IconInput
                          placeholder="Rua, Avenida..."
                          value={formData.address}
                          onChangeText={(text: string) =>
                            handleInputChange('address', text)
                          }
                          editable={false}
                        />
                      </View>
                      <View style={styles.gridCol}>
                        <Text style={styles.inputLabel}>Número *</Text>
                        <IconInput
                          placeholder="123"
                          value={formData.numero}
                          onChangeText={(text: string) =>
                            handleInputChange('numero', text)
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.gridCol}>
                        <Text style={styles.inputLabel}>Complemento</Text>
                        <IconInput
                          placeholder="Apto, Bloco, Casa 2..."
                          value={formData.complemento}
                          onChangeText={(text: string) =>
                            handleInputChange('complemento', text)
                          }
                          multiline={true}
                        />
                      </View>
                      <View style={styles.gridCol}>
                        <Text style={styles.inputLabel}>Cidade *</Text>
                        <IconInput
                          placeholder="Sua cidade"
                          value={formData.city}
                          onChangeText={(text: string) =>
                            handleInputChange('city', text)
                          }
                          editable={false}
                        />
                      </View>
                      <View style={styles.gridCol}>
                        <Text style={styles.inputLabel}>Estado *</Text>
                        <IconInput
                          placeholder="UF"
                          value={formData.state}
                          onChangeText={(text: string) =>
                            handleInputChange('state', text)
                          }
                          editable={false}
                          maxLength={2}
                        />
                      </View>
                    </View>
                  </View>

                  {/* ... (CNH - Sem alterações, é necessária para ambos) ... */}
                  <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>
                      Carteira Nacional de Habilitação
                    </Text>
                    <View style={styles.gridRow}>
                      <View style={styles.gridCol}>
                        <Text style={styles.inputLabel}>Número da CNH *</Text>
                        <IconInput
                          icon={CreditCard}
                          value={formData.cnh}
                          onChangeText={(text: string) =>
                            handleInputChange('cnh', text)
                          }
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.gridCol}>
                        <Text style={styles.inputLabel}>Categoria *</Text>
                        <IconInput
                          placeholder="A, B, AB, etc."
                          value={formData.cnhCategory}
                          onChangeText={(text: string) =>
                            handleInputChange('cnhCategory', text)
                          }
                        />
                      </View>
                      <View style={styles.gridCol}>
                        <Text style={styles.inputLabel}>Validade da CNH *</Text>
                        <IconInput
                          placeholder="AAAA-MM-DD"
                          value={formData.cnhExpiry}
                          onChangeText={(text: string) =>
                            handleInputChange('cnhExpiry', text)
                          }
                        />
                      </View>
                    </View>
                  </View>

                  {/*
                   * ATUALIZADO: Seção de Veículo
                   * Agora SÓ é exibida se userType === 'passenger'
                   */}
                  {userType === 'passenger' && (
                    <View style={styles.formSection}>
                      <Text style={styles.sectionTitle}>
                        Dados do Seu Veículo
                      </Text>
                      <View style={styles.gridRow}>
                        <View style={styles.gridCol}>
                          <Text style={styles.inputLabel}>Placa *</Text>
                          <IconInput
                            placeholder="ABC-1234"
                            value={formData.vehiclePlate}
                            onChangeText={(text: string) =>
                              handleInputChange('vehiclePlate', text)
                            }
                          />
                        </View>
                        <View style={styles.gridCol}>
                          <Text style={styles.inputLabel}>Marca *</Text>
                          <IconInput
                            placeholder="Ex: Toyota, Honda"
                            value={formData.vehicleBrand}
                            onChangeText={(text: string) =>
                              handleInputChange('vehicleBrand', text)
                            }
                          />
                        </View>
                        <View style={styles.gridCol}>
                          <Text style={styles.inputLabel}>Modelo *</Text>
                          <IconInput
                            placeholder="Ex: Corolla, Civic"
                            value={formData.vehicleModel}
                            onChangeText={(text: string) =>
                              handleInputChange('vehicleModel', text)
                            }
                          />
                        </View>
                        <View style={styles.gridCol}>
                          <Text style={styles.inputLabel}>Ano *</Text>
                          <IconInput
                            placeholder="2020"
                            value={formData.vehicleYear}
                            onChangeText={(text: string) =>
                              handleInputChange('vehicleYear', text)
                            }
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.gridCol}>
                          <Text style={styles.inputLabel}>Cor</Text>
                          <IconInput
                            placeholder="Ex: Preto, Branco"
                            value={formData.vehicleColor}
                            onChangeText={(text: string) =>
                              handleInputChange('vehicleColor', text)
                            }
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* ... (Email, Senha, Confirmar Senha - Sem alterações) ... */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  E-mail {!isLogin && '*'}
                </Text>
                <View style={styles.inputContainer}>
                  <Mail
                    color={COLORS.darkGray}
                    size={20}
                    style={styles.inputIconLeft}
                  />
                  <TextInput
                    style={[styles.input, styles.inputWithIconLeft]}
                    placeholder="seu@email.com"
                    placeholderTextColor={COLORS.darkGray}
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Senha {!isLogin && '*'}
                </Text>
                <View style={styles.inputContainer}>
                  <Lock
                    color={COLORS.darkGray}
                    size={20}
                    style={styles.inputIconLeft}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      styles.inputWithIconLeft,
                      styles.inputWithIconRight,
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.darkGray}
                    value={formData.password}
                    onChangeText={(text) => handleInputChange('password', text)}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.inputIconRight}
                    onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff color={COLORS.darkGray} size={20} />
                    ) : (
                      <Eye color={COLORS.darkGray} size={20} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {!isLogin && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirmar Senha *</Text>
                  <View style={styles.inputContainer}>
                    <Lock
                      color={COLORS.darkGray}
                      size={20}
                      style={styles.inputIconLeft}
                    />
                    <TextInput
                      style={[styles.input, styles.inputWithIconLeft]}
                      placeholder="••••••••"
                      placeholderTextColor={COLORS.darkGray}
                      value={formData.confirmPassword}
                      onChangeText={(text) =>
                        handleInputChange('confirmPassword', text)
                      }
                      secureTextEntry={!showPassword}
                    />
                  </View>
                </View>
              )}

              {/* ... (Esqueceu senha, Botão, Divider, Social, Footer - Sem alterações) ... */}
              {isLogin && (
                <View style={styles.forgotPasswordContainer}>
                  <TouchableOpacity>
                    <Text style={styles.forgotPasswordText}>
                      Esqueceu a senha?
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                </Text>
                <ArrowRight color={COLORS.white} size={24} />
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou continue com</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialLoginContainer}>
                <TouchableOpacity style={styles.socialButton}>
                  <Svg height="24" width="24" viewBox="0 0 24 24">
                    <Path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <Path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <Path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <Path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                    />
                  </Svg>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Svg height="28" width="28" viewBox="0 0 24 24">
                    <Path
                      fill="#1877F2"
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </Svg>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Svg height="28" width="28" viewBox="0 0 24 24">
                    <Path
                      fill="#000000"
                      d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.footerText}>
              Ao continuar, você concorda com nossos{' '}
              <Text style={styles.footerLink}>Termos de Uso</Text> e{' '}
              <Text style={styles.footerLink}>Política de Privacidade</Text>.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ... (Estilos - Nenhuma alteração nos estilos) ...
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.mediumGray,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 672,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    elevation: 10,
  },
  userTypeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 8,
  },
  userTypeButtonActive: {
    backgroundColor: COLORS.primary,
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  userTypeButtonInactive: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.7,
  },
  userTypeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userTypeButtonTextActive: {
    color: COLORS.white,
  },
  userTypeButtonTextInactive: {
    color: COLORS.black,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 6,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.white,
    elevation: 2,
  },
  tabButtonInactive: {
    backgroundColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  formContainer: {},
  formSection: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.lightGray,
    marginBottom: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -8,
  },
  gridCol: {
    width: '100%',
    padding: 8,
  },
  inputGroup: {
    marginBottom: 16,
    width: '100%',
    padding: 8,
    paddingHorizontal: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: COLORS.lightGray,
    borderWidth: 2,
    borderRadius: 12,
    width: '100%',
  },
  inputDisabled: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.8,
  },
  inputContainerMultiline: {
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.black,
  },
  inputWithIconLeft: {
    paddingLeft: 48,
  },
  inputWithIconRight: {
    paddingRight: 48,
  },
  inputWithoutIcon: {
    paddingLeft: 16,
  },
  inputMultiline: {
    minHeight: 80,
    height: 'auto',
    paddingTop: 16,
    paddingBottom: 16,
    textAlignVertical: 'top',
  },
  inputIconLeft: {
    position: 'absolute',
    left: 12,
    top: Platform.OS === 'ios' ? 17 : 15,
    zIndex: 1,
  },
  inputIconRight: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
    padding: 4,
    top: Platform.OS === 'ios' ? 13 : 11,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    marginHorizontal: 8,
    gap: 12,
    elevation: 5,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 16,
    marginHorizontal: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  socialLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginHorizontal: 8,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    elevation: 2,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 24,
    lineHeight: 20,
  },
  footerLink: {
    fontWeight: '600',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});