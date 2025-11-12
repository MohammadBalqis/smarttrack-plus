import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'http://10.0.2.2:5000'; // For Android emulator
  // If running on Linux desktop or Chrome: use http://localhost:5000

  static Future<String> health() async {
    final res = await http.get(Uri.parse('$baseUrl/api/health'));
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      return data['status'] ?? 'ok';
    } else {
      throw Exception('API error: ${res.statusCode}');
    }
  }
}
