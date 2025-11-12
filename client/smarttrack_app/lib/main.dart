import 'package:flutter/material.dart';
import 'core/services/api_service.dart';

void main() {
  runApp(const SmartTrackApp());
}

class SmartTrackApp extends StatelessWidget {
  const SmartTrackApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SmartTrack+',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const ApiTestScreen(),
    );
  }
}

class ApiTestScreen extends StatefulWidget {
  const ApiTestScreen({super.key});
  @override
  State<ApiTestScreen> createState() => _ApiTestScreenState();
}

class _ApiTestScreenState extends State<ApiTestScreen> {
  String _status = 'Connecting...';

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  Future<void> _loadStatus() async {
    try {
      final s = await ApiService.health();
      setState(() => _status = s);
    } catch (e) {
      setState(() => _status = 'Error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('SmartTrack+ API Test')),
      body: Center(child: Text(_status, style: const TextStyle(fontSize: 20))),
    );
  }
}
