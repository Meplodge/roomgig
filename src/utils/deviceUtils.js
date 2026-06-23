import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';

const DEVICE_ID_KEY = '@realestate_device_id';
const DEVICE_BINDING_KEY = '@realestate_device_binding';

/**
 * Gets or creates a unique device identifier
 * Uses expo-device to get device info and generates a unique ID
 */
export const getDeviceId = async () => {
  try {
    // Check if we already have a device ID stored
    const storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (storedDeviceId) {
      return storedDeviceId;
    }

    // Generate a new device ID based on device info
    const deviceInfo = {
      deviceId: Device.deviceId || null,
      deviceName: Device.deviceName || null,
      manufacturer: Device.manufacturer || null,
      model: Device.model || null,
      osVersion: Device.osVersion || null,
    };

    // Create a unique ID by combining device info with timestamp
    const uniqueId = `${deviceInfo.manufacturer}_${deviceInfo.model}_${Date.now()}`;
    
    // Store the device ID
    await AsyncStorage.setItem(DEVICE_ID_KEY, uniqueId);
    
    return uniqueId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to a random ID if device info fails
    const fallbackId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, fallbackId);
    return fallbackId;
  }
};

/**
 * Binds a device to a user account
 * @param {string} userId - The user ID to bind the device to
 * @param {string} deviceId - The device ID to bind
 */
export const bindDeviceToAccount = async (userId, deviceId) => {
  try {
    const binding = {
      userId,
      deviceId,
      boundAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(DEVICE_BINDING_KEY, JSON.stringify(binding));
    return true;
  } catch (error) {
    console.error('Error binding device to account:', error);
    return false;
  }
};

/**
 * Gets the current device binding
 * @returns {Object|null} The binding object or null if not bound
 */
export const getDeviceBinding = async () => {
  try {
    const binding = await AsyncStorage.getItem(DEVICE_BINDING_KEY);
    return binding ? JSON.parse(binding) : null;
  } catch (error) {
    console.error('Error getting device binding:', error);
    return null;
  }
};

/**
 * Checks if the device is already bound to an account
 * @returns {boolean} True if device is bound, false otherwise
 */
export const isDeviceBound = async () => {
  const binding = await getDeviceBinding();
  return binding !== null;
};

/**
 * Removes the device binding (for logout/account deletion)
 */
export const removeDeviceBinding = async () => {
  try {
    await AsyncStorage.removeItem(DEVICE_BINDING_KEY);
    return true;
  } catch (error) {
    console.error('Error removing device binding:', error);
    return false;
  }
};

/**
 * Validates that the current device matches the bound device
 * @param {string} currentDeviceId - The current device ID
 * @returns {boolean} True if device matches, false otherwise
 */
export const validateDeviceBinding = async (currentDeviceId) => {
  try {
    const binding = await getDeviceBinding();
    if (!binding) {
      return true; // No binding exists, so it's valid
    }
    return binding.deviceId === currentDeviceId;
  } catch (error) {
    console.error('Error validating device binding:', error);
    return false;
  }
};
