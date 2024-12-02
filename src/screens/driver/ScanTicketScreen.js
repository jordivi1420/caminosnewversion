import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ScanTicketScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Scan Ticket Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScanTicketScreen;
